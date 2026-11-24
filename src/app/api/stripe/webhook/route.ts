import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getServerEnv } from "@/lib/config/env"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { trySendInternalDonationNotifications } from "@/lib/email/trySendInternalDonationNotifications"
import {
  claimWebhookEvent,
  completeWebhookEvent,
  failWebhookEvent,
  readWebhookEventClaim,
} from "@/lib/stripe/webhookEventClaim"
import * as Sentry from "@sentry/nextjs"
import { isSentryDisabled } from "@/lib/launch-flags"

// Ensure webhook runs in the Node.js runtime (not edge)
export const runtime = "nodejs"

// Requested execution cap in seconds. Hosts may honor, clamp, or ignore it.
// This is not a measured bound for receipt PDF generation or email sending.
// Keep this equal to WEBHOOK_ROUTE_MAX_DURATION_SECONDS. STALE_CLAIM_MS must stay above it.
export const maxDuration = 300

/** Unmatched payment intents younger than this stay retryable so checkout can store the payment intent id first. Refunds do not use this cutoff. */
const UNLINKED_PAYMENT_INTENT_RETRY_MS = 15 * 60 * 1000

type ServiceClient = ReturnType<typeof getSupabaseServiceClient>
type HandlerResult = "done" | "retry"
type PaymentRow = { id: string; payment_status: string }
type SettleResult = "updated" | "paid" | "refunded" | "retry"

function constructWebhookEvent(body: string, signature: string, env: ReturnType<typeof getServerEnv>): Stripe.Event {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
  })
  try {
    return stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch (primaryErr) {
    if (env.STRIPE_SPONSOR_WEBHOOK_SECRET) {
      try {
        return stripe.webhooks.constructEvent(body, signature, env.STRIPE_SPONSOR_WEBHOOK_SECRET)
      } catch {
        // fall through to rethrow primary
      }
    } else {
      console.error(
        "STRIPE_SPONSOR_WEBHOOK_SECRET is not configured; sponsor-account webhook signatures cannot be verified.",
      )
    }
    const error = primaryErr as Error
    console.error("Webhook signature verification failed:", error.message)
    throw error
  }
}

function metadataIds(event: Stripe.Event): { listingId: string | null; donationId: string | null } {
  let listingId: string | null = null
  let donationId: string | null = null

  if (event.data.object && typeof event.data.object === "object" && "metadata" in event.data.object) {
    const metadata = event.data.object.metadata as Record<string, string> | null
    const entityType = metadata?.entity_type
    const entityId = metadata?.entity_id

    if (entityType === "listing" && entityId) {
      listingId = entityId
    } else if (entityType === "donation" && entityId) {
      donationId = entityId
    }
  }

  return { listingId, donationId }
}

export async function POST(req: NextRequest) {
  const env = getServerEnv()
  const supabase = getSupabaseServiceClient()

  const signature = req.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  const body = await req.text()
  let event: Stripe.Event

  try {
    event = constructWebhookEvent(body, signature, env)
  } catch (err) {
    const error = err as Error
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 })
  }

  const eventId = event.id
  const eventType = event.type
  const { listingId, donationId } = metadataIds(event)

  const claim = await claimWebhookEvent(supabase, {
    eventId,
    eventType,
    listingId,
    donationId,
    stripeCreated: new Date(event.created * 1000).toISOString(),
  })

  if (claim.outcome === "error") {
    return NextResponse.json({ error: "Idempotency check failed" }, { status: 500 })
  }
  if (claim.outcome === "completed") {
    return NextResponse.json({ received: true }, { status: 200 })
  }
  if (claim.outcome === "in_progress") {
    return NextResponse.json({ error: "Webhook event is already in progress" }, { status: 500 })
  }

  console.log(
    `Processing webhook event: ${eventType} (${eventId}), listingId: ${listingId || "N/A"}, donationId: ${
      donationId || "N/A"
    }`,
  )

  let outcome: HandlerResult = "retry"
  try {
    outcome = await handleStripeEvent(supabase, event)
  } catch (error) {
    console.error("Error processing webhook:", error)
    if (!isSentryDisabled()) {
      Sentry.captureException(error, { tags: { route: "stripe/webhook" } })
    }
    outcome = "retry"
  }

  if (outcome === "done") {
    const finished = await finishOwnedClaim(supabase, eventId, claim.claimToken, "complete")
    if (finished === "finished" || finished === "already_completed") {
      return NextResponse.json({ received: true }, { status: 200 })
    }
    return NextResponse.json({ error: "Failed to record webhook completion" }, { status: 500 })
  }

  const released = await finishOwnedClaim(supabase, eventId, claim.claimToken, "fail")
  if (released === "already_completed") {
    return NextResponse.json({ received: true }, { status: 200 })
  }
  return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
}

async function finishOwnedClaim(
  supabase: ServiceClient,
  eventId: string,
  claimToken: string,
  mode: "complete" | "fail",
): Promise<"finished" | "already_completed" | "unresolved"> {
  const result =
    mode === "complete"
      ? await completeWebhookEvent(supabase, eventId, claimToken)
      : await failWebhookEvent(supabase, eventId, claimToken)

  if (result === "updated") return "finished"

  if (result === "lost_ownership") {
    console.error(`Webhook event ${eventId} ${mode} lost claim ownership`)
    return (await claimIsCompleted(supabase, eventId)) ? "already_completed" : "unresolved"
  }

  if (mode === "complete") {
    const released = await failWebhookEvent(supabase, eventId, claimToken)
    if (released === "updated") return "unresolved"
    if (released === "lost_ownership") {
      return (await claimIsCompleted(supabase, eventId)) ? "already_completed" : "unresolved"
    }
  }

  return "unresolved"
}

async function claimIsCompleted(supabase: ServiceClient, eventId: string): Promise<boolean> {
  const current = await readWebhookEventClaim(supabase, eventId)
  return current.ok && current.row?.status === "completed"
}

async function handleStripeEvent(supabase: ServiceClient, event: Stripe.Event): Promise<HandlerResult> {
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session)
    case "payment_intent.succeeded":
      return handlePaymentIntentSucceeded(supabase, event, event.data.object as Stripe.PaymentIntent)
    case "charge.refunded":
      return handleChargeRefunded(supabase, event, event.data.object as Stripe.Charge)
    default:
      console.log(`Unhandled event type: ${event.type}`)
      return "done"
  }
}

async function handleCheckoutCompleted(
  supabase: ServiceClient,
  session: Stripe.Checkout.Session,
): Promise<HandlerResult> {
  if (session.payment_status !== "paid") {
    console.log(`Session ${session.id} payment_status is ${session.payment_status}, not paid`)
    return "done"
  }

  const entityType = session.metadata?.entity_type
  const entityId = session.metadata?.entity_id

  if (!entityType) {
    console.error("No entity_type in session metadata", {
      sessionId: session.id,
      metadata: session.metadata,
    })
    return "done"
  }

  if (entityType === "listing") {
    return handleListingCheckout(supabase, session, entityId)
  }
  if (entityType === "donation") {
    return handleDonationCheckout(supabase, session, entityId)
  }
  return "done"
}

async function handleListingCheckout(
  supabase: ServiceClient,
  session: Stripe.Checkout.Session,
  entityId: string | undefined,
): Promise<HandlerResult> {
  if (!entityId) {
    console.error("No entity_id in session metadata for listing", {
      sessionId: session.id,
      metadata: session.metadata,
    })
    return "done"
  }

  const listing = await supabase.from("listings").select("id, payment_status").eq("id", entityId).maybeSingle()
  if (listing.error) {
    console.error(`Listing ${entityId} lookup failed`, { error: listing.error, sessionId: session.id })
    return "retry"
  }
  if (!listing.data) {
    console.error(`Listing ${entityId} not found`, { sessionId: session.id })
    return "retry"
  }

  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null
  const settled = await settlePayment(supabase, "listings", listing.data, {
    payment_status: "paid",
    stripe_payment_intent_id: paymentIntentId,
    status: "pending",
  })
  if (settled === "retry") {
    console.error(`Failed to update listing ${entityId}:`, { sessionId: session.id, paymentIntentId })
    return "retry"
  }
  if (settled === "updated") {
    console.log(`Updated listing ${entityId} to paid`)
  } else if (settled === "refunded") {
    console.log(`Listing ${entityId} already refunded`)
  } else {
    console.log(`Listing ${entityId} already marked as paid`)
  }
  return "done"
}

async function handleDonationCheckout(
  supabase: ServiceClient,
  session: Stripe.Checkout.Session,
  entityId: string | undefined,
): Promise<HandlerResult> {
  const bySession = await supabase
    .from("donations")
    .select("id, payment_status")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle()

  if (bySession.error) {
    console.error("Donation lookup by checkout session failed", { error: bySession.error, sessionId: session.id })
    return "retry"
  }

  let resolved: PaymentRow | null = bySession.data

  if (!resolved && entityId) {
    const fallback = await supabase.from("donations").select("id, payment_status").eq("id", entityId).maybeSingle()
    if (fallback.error) {
      console.error("Donation metadata fallback lookup failed", { error: fallback.error, sessionId: session.id })
      return "retry"
    }
    if (fallback.data) {
      console.warn("Donation resolved via metadata fallback (no stripe_checkout_session_id match)", {
        sessionId: session.id,
        donationId: entityId,
      })
      resolved = fallback.data
    }
  }

  if (entityId && resolved && entityId !== resolved.id) {
    console.warn("Donation session id and metadata entity_id disagree; using session-linked row", {
      sessionId: session.id,
      fromSession: resolved.id,
      fromMetadata: entityId,
    })
  }

  if (!resolved) {
    console.error("Donation not found for checkout session", {
      sessionId: session.id,
      metadataEntityId: entityId,
    })
    return "retry"
  }

  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null
  const stripeTotal = session.amount_total
  const settled = await settlePayment(supabase, "donations", resolved, {
    payment_status: "paid",
    stripe_payment_intent_id: paymentIntentId,
    ...(stripeTotal != null ? { amount: stripeTotal } : {}),
  })

  if (settled === "retry") {
    console.error(`Failed to update donation ${resolved.id}:`, {
      sessionId: session.id,
      paymentIntentId,
    })
    return "retry"
  }
  if (settled === "refunded") {
    console.log(`Donation ${resolved.id} already refunded`)
    return "done"
  }

  if (settled === "updated") {
    console.log(`Updated donation ${resolved.id} to paid`)
  } else {
    console.log(`Donation ${resolved.id} already marked as paid`)
  }

  console.log("Internal donation notification: invoking helper", {
    donationId: resolved.id,
    source: "checkout.session.completed",
  })
  await trySendInternalDonationNotifications({
    supabase,
    donationId: resolved.id,
    session,
  })
  return "done"
}

async function handlePaymentIntentSucceeded(
  supabase: ServiceClient,
  event: Stripe.Event,
  paymentIntent: Stripe.PaymentIntent,
): Promise<HandlerResult> {
  const chargeId = typeof paymentIntent.latest_charge === "string" ? paymentIntent.latest_charge : null
  if (!chargeId) return "done"

  const listing = await supabase
    .from("listings")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .maybeSingle()

  if (listing.error) {
    console.error(`Listing lookup failed for payment_intent ${paymentIntent.id}:`, listing.error)
    return "retry"
  }

  if (listing.data) {
    const { error } = await supabase.from("listings").update({ stripe_charge_id: chargeId }).eq("id", listing.data.id)
    if (error) {
      console.error(`Failed to update listing ${listing.data.id} with charge_id:`, error)
      return "retry"
    }
    console.log(`Updated listing ${listing.data.id} with charge_id ${chargeId}`)
    return "done"
  }

  const donation = await supabase
    .from("donations")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .maybeSingle()

  if (donation.error) {
    console.error(`Donation lookup failed for payment_intent ${paymentIntent.id}:`, donation.error)
    return "retry"
  }

  if (!donation.data) {
    const ageMs = Date.now() - event.created * 1000
    if (ageMs < UNLINKED_PAYMENT_INTENT_RETRY_MS) {
      console.error("No listing or donation found for recent payment_intent; leaving event retryable", {
        eventId: event.id,
        paymentIntentId: paymentIntent.id,
      })
      return "retry"
    }
    console.log(`No listing or donation found for payment_intent ${paymentIntent.id}`)
    return "done"
  }

  const { error } = await supabase.from("donations").update({ stripe_charge_id: chargeId }).eq("id", donation.data.id)
  if (error) {
    console.error(`Failed to update donation ${donation.data.id} with charge_id:`, error)
    return "retry"
  }

  console.log(`Updated donation ${donation.data.id} with charge_id ${chargeId}`)
  console.log("Internal donation notification: invoking helper", {
    donationId: donation.data.id,
    source: "payment_intent.succeeded",
  })
  await trySendInternalDonationNotifications({
    supabase,
    donationId: donation.data.id,
    paymentIntent,
  })
  return "done"
}

async function handleChargeRefunded(
  supabase: ServiceClient,
  event: Stripe.Event,
  charge: Stripe.Charge,
): Promise<HandlerResult> {
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null
  const chargeId = charge.id

  let listingId: string | null = null
  let donationId: string | null = null

  if (paymentIntentId) {
    const byIntent = await findRefundTarget(supabase, "stripe_payment_intent_id", paymentIntentId)
    if (byIntent === "retry") return "retry"
    listingId = byIntent.listingId
    donationId = byIntent.donationId
  }

  if (!listingId && !donationId && chargeId) {
    const byCharge = await findRefundTarget(supabase, "stripe_charge_id", chargeId)
    if (byCharge === "retry") return "retry"
    listingId = byCharge.listingId
    donationId = byCharge.donationId
  }

  if (listingId) {
    const { error } = await supabase.from("listings").update({ payment_status: "refunded" }).eq("id", listingId)
    if (error) {
      console.error(`Failed to update listing ${listingId} to refunded:`, error)
      return "retry"
    }
    console.log(`Updated listing ${listingId} to refunded`)
    return "done"
  }

  if (donationId) {
    const { error } = await supabase.from("donations").update({ payment_status: "refunded" }).eq("id", donationId)
    if (error) {
      console.error(`Failed to update donation ${donationId} to refunded:`, error)
      return "retry"
    }
    console.log(`Updated donation ${donationId} to refunded`)
    return "done"
  }

  console.error("Unmatched charge.refunded; leaving event retryable", {
    eventId: event.id,
    chargeId,
    paymentIntentId,
  })
  return "retry"
}

async function findRefundTarget(
  supabase: ServiceClient,
  column: "stripe_payment_intent_id" | "stripe_charge_id",
  value: string,
): Promise<{ listingId: string | null; donationId: string | null } | "retry"> {
  const listing = await supabase.from("listings").select("id").eq(column, value).maybeSingle()
  if (listing.error) {
    console.error(`Listing refund lookup failed on ${column}:`, listing.error)
    return "retry"
  }
  if (listing.data) return { listingId: listing.data.id, donationId: null }

  const donation = await supabase.from("donations").select("id").eq(column, value).maybeSingle()
  if (donation.error) {
    console.error(`Donation refund lookup failed on ${column}:`, donation.error)
    return "retry"
  }
  return { listingId: null, donationId: donation.data?.id ?? null }
}

async function settlePayment(
  supabase: ServiceClient,
  table: "listings" | "donations",
  row: PaymentRow,
  patch: Record<string, unknown>,
): Promise<SettleResult> {
  if (row.payment_status === "paid") return "paid"
  if (row.payment_status === "refunded") return "refunded"

  const updated = await supabase
    .from(table)
    .update(patch)
    .eq("id", row.id)
    .eq("payment_status", row.payment_status)
    .select("id")

  if (updated.error) {
    console.error(`Failed to update ${table} ${row.id} payment state:`, updated.error)
    return "retry"
  }
  if (hasRows(updated.data)) return "updated"

  const current = await supabase.from(table).select("id, payment_status").eq("id", row.id).maybeSingle()
  if (current.error || !current.data) {
    console.error(`Failed to reread ${table} ${row.id} after conditional payment update`, current.error)
    return "retry"
  }
  if (current.data.payment_status === "paid") return "paid"
  if (current.data.payment_status === "refunded") return "refunded"
  return "retry"
}

function hasRows(data: unknown): boolean {
  return Array.isArray(data) && data.length > 0
}
