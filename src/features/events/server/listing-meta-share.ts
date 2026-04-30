import { normalizeShareRecipientEmails } from "@/lib/listing-share"

/**
 * Merge client-provided listing meta into existing. Never applies client `share.sent_at`.
 */
export function mergeListingMetaFromClient(
  existingMeta: Record<string, unknown> | null | undefined,
  clientPatch: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(existingMeta ?? {}) }
  if (!clientPatch) return out

  for (const [key, value] of Object.entries(clientPatch)) {
    if (key === "share" && value && typeof value === "object" && !Array.isArray(value)) {
      const incoming = value as Record<string, unknown>
      const prev =
        out.share && typeof out.share === "object" && !Array.isArray(out.share)
          ? { ...(out.share as Record<string, unknown>) }
          : {}
      const nextShare: Record<string, unknown> = { ...prev }
      if ("recipient_emails" in incoming) {
        nextShare.recipient_emails = incoming.recipient_emails
      }
      if (typeof prev.sent_at === "string") {
        nextShare.sent_at = prev.sent_at
      } else {
        delete nextShare.sent_at
      }
      out.share = nextShare
    } else if (key !== "share") {
      out[key] = value
    }
  }
  return out
}

export function mergeListingMetaWithServerShareSentAt(
  existingMeta: Record<string, unknown> | null | undefined,
  sentAtIso: string
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(existingMeta ?? {}) }
  const prev =
    out.share && typeof out.share === "object" && !Array.isArray(out.share)
      ? { ...(out.share as Record<string, unknown>) }
      : {}
  out.share = { ...prev, sent_at: sentAtIso }
  return out
}

/**
 * Create path: merge client meta, normalize share emails, drop empty share.
 */
export function buildPersistableListingMeta(
  clientMeta: Record<string, unknown> | null | undefined,
  submitterEmail: string
): Record<string, unknown> {
  const merged = mergeListingMetaFromClient({}, clientMeta ?? {})
  const share = merged.share
  if (share && typeof share === "object" && !Array.isArray(share)) {
    const emails = (share as Record<string, unknown>).recipient_emails
    if (Array.isArray(emails)) {
      const normalized = normalizeShareRecipientEmails(
        emails.filter((e): e is string => typeof e === "string"),
        submitterEmail
      )
      if (normalized.length === 0) {
        const next = { ...merged }
        delete next.share
        return next
      }
      merged.share = { ...(share as Record<string, unknown>), recipient_emails: normalized }
    }
  }
  return merged
}

/**
 * PATCH path: merge client meta patch into existing row meta, re-normalize recipients with effective contact email.
 */
export function finalizeListingMetaAfterClientPatch(
  existingMeta: Record<string, unknown>,
  clientMetaPatch: Record<string, unknown> | undefined,
  contactEmail: string
): Record<string, unknown> | null {
  if (!clientMetaPatch) return null
  let merged = mergeListingMetaFromClient(existingMeta, clientMetaPatch)
  const share = merged.share
  if (share && typeof share === "object" && !Array.isArray(share)) {
    const emails = (share as Record<string, unknown>).recipient_emails
    if (Array.isArray(emails)) {
      const normalized = normalizeShareRecipientEmails(
        emails.filter((e): e is string => typeof e === "string"),
        contactEmail
      )
      if (normalized.length === 0) {
        const prevShare = { ...(share as Record<string, unknown>) }
        delete prevShare.recipient_emails
        const hasOther =
          Object.keys(prevShare).filter((k) => k !== "sent_at").length > 0
        if (hasOther) {
          merged = { ...merged, share: prevShare }
        } else if (typeof prevShare.sent_at === "string") {
          merged = { ...merged, share: { sent_at: prevShare.sent_at } }
        } else {
          const { share: _, ...rest } = merged
          merged = rest
        }
      } else {
        merged = {
          ...merged,
          share: { ...(share as Record<string, unknown>), recipient_emails: normalized },
        }
      }
    }
  }
  return merged
}
