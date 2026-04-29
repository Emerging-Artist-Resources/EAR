import { z } from "zod"

export const MAX_SHARE_RECIPIENT_EMAILS = 10

const emailSchema = z.string().email()

/**
 * Trim, lowercase, dedupe, exclude submitter, cap length, drop invalid.
 * Use on persist and again before send (defense in depth).
 */
export function normalizeShareRecipientEmails(
  raw: string[],
  submitterEmail: string
): string[] {
  const submitterNorm = submitterEmail.trim().toLowerCase()
  const seen = new Set<string>()
  const out: string[] = []
  for (const r of raw) {
    if (typeof r !== "string") continue
    const t = r.trim().toLowerCase()
    if (!t) continue
    if (!emailSchema.safeParse(t).success) continue
    if (t === submitterNorm) continue
    if (seen.has(t)) continue
    seen.add(t)
    out.push(t)
    if (out.length >= MAX_SHARE_RECIPIENT_EMAILS) break
  }
  return out
}
