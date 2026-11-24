import { randomUUID } from "crypto"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Configured webhook route timeout in seconds. The route exports this same
 * number as `maxDuration`. It is the timeout the route asks the host for, not
 * a measurement that PDF generation or email sending finishes within it.
 * Hosts may honor, clamp, or ignore `maxDuration`.
 */
export const WEBHOOK_ROUTE_MAX_DURATION_SECONDS = 300

/**
 * Reclaim a processing claim only after this long.
 * Fifteen minutes is above the configured 300 second route timeout, so an
 * attempt that runs for the full configured duration is not taken over, with
 * margin if the host is slow to stop it. If the host does not enforce
 * maxDuration and the invocation is still running after this window, another
 * delivery can replace the token.
 */
export const STALE_CLAIM_MS = 15 * 60 * 1000

export type WebhookClaim =
  | { outcome: "claimed"; claimToken: string }
  | { outcome: "completed" }
  | { outcome: "in_progress" }
  | { outcome: "error" }

export type ClaimWriteResult = "updated" | "lost_ownership" | "error"

type ClaimRow = {
  status: string
  claim_token: string | null
}

type ClaimStore = SupabaseClient

export async function claimWebhookEvent(
  supabase: ClaimStore,
  input: {
    eventId: string
    eventType: string
    listingId: string | null
    donationId: string | null
    stripeCreated: string
  },
): Promise<WebhookClaim> {
  const claimToken = randomUUID()
  const claimedAt = new Date().toISOString()
  const insertResult = await supabase.from("stripe_webhook_events").insert({
    id: input.eventId,
    type: input.eventType,
    listing_id: input.listingId,
    donation_id: input.donationId,
    stripe_created: input.stripeCreated,
    status: "processing",
    claim_token: claimToken,
    claimed_at: claimedAt,
    completed_at: null,
  })

  if (!insertResult.error) {
    return { outcome: "claimed", claimToken }
  }

  if (insertResult.error.code !== "23505") {
    console.error("Failed to claim webhook event:", insertResult.error)
    return { outcome: "error" }
  }

  const failedTakeover = await supabase
    .from("stripe_webhook_events")
    .update({
      status: "processing",
      claim_token: claimToken,
      claimed_at: claimedAt,
    })
    .eq("id", input.eventId)
    .eq("status", "failed")
    .select("id")

  if (failedTakeover.error) {
    console.error("Failed to reclaim webhook event:", failedTakeover.error)
    return { outcome: "error" }
  }
  if (hasUpdatedRow(failedTakeover.data)) {
    return { outcome: "claimed", claimToken }
  }

  const staleBefore = new Date(Date.now() - STALE_CLAIM_MS).toISOString()
  const staleTakeover = await supabase
    .from("stripe_webhook_events")
    .update({
      status: "processing",
      claim_token: claimToken,
      claimed_at: claimedAt,
    })
    .eq("id", input.eventId)
    .eq("status", "processing")
    .lt("claimed_at", staleBefore)
    .select("id")

  if (staleTakeover.error) {
    console.error("Failed to reclaim stale webhook event:", staleTakeover.error)
    return { outcome: "error" }
  }
  if (hasUpdatedRow(staleTakeover.data)) {
    return { outcome: "claimed", claimToken }
  }

  const existing = await readWebhookEventClaim(supabase, input.eventId)
  if (!existing.ok) return { outcome: "error" }
  if (existing.row?.status === "completed") return { outcome: "completed" }
  return { outcome: "in_progress" }
}

export async function completeWebhookEvent(
  supabase: ClaimStore,
  eventId: string,
  claimToken: string,
): Promise<ClaimWriteResult> {
  return writeOwnedClaim(supabase, eventId, claimToken, {
    status: "completed",
    completed_at: new Date().toISOString(),
  })
}

export async function failWebhookEvent(
  supabase: ClaimStore,
  eventId: string,
  claimToken: string,
): Promise<ClaimWriteResult> {
  return writeOwnedClaim(supabase, eventId, claimToken, {
    status: "failed",
  })
}

export async function readWebhookEventClaim(
  supabase: ClaimStore,
  eventId: string,
): Promise<{ ok: true; row: ClaimRow | null } | { ok: false }> {
  const result = await supabase
    .from("stripe_webhook_events")
    .select("status, claim_token")
    .eq("id", eventId)
    .maybeSingle()

  if (result.error) {
    console.error("Failed to read webhook event claim:", result.error)
    return { ok: false }
  }

  return { ok: true, row: (result.data as ClaimRow | null) ?? null }
}

async function writeOwnedClaim(
  supabase: ClaimStore,
  eventId: string,
  claimToken: string,
  patch: { status: "completed" | "failed"; completed_at?: string },
): Promise<ClaimWriteResult> {
  const result = await supabase
    .from("stripe_webhook_events")
    .update(patch)
    .eq("id", eventId)
    .eq("status", "processing")
    .eq("claim_token", claimToken)
    .select("id")

  if (result.error) {
    console.error(`Failed to mark webhook event ${patch.status}:`, result.error)
    return "error"
  }
  if (!hasUpdatedRow(result.data)) return "lost_ownership"
  return "updated"
}

function hasUpdatedRow(data: unknown): boolean {
  return Array.isArray(data) && data.length > 0
}
