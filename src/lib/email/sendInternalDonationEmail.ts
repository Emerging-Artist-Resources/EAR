/**
 * Internal donation notifications (artist + admin) via Postmark templates + PDF attachment.
 */

import { Attachment, TemplatedMessage } from "postmark"
import { postmarkClient } from "./postmark"

export const DONATION_TEMPLATE_ARTIST = "donation-notification-artist"
export const DONATION_TEMPLATE_ADMIN = "donation-notification-admin"

/** Safe segment for attachment names: strips path/hostile chars, collapses whitespace to hyphens. */
function sanitizeAttachmentArtistSegment(raw: string, maxLen: number): string {
  let t = raw
    .trim()
    .replace(/[/\\:*?"<>|#\u0000-\u001f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, maxLen)
    .replace(/[-.]+$/g, "")
  if (!t) t = "recipient"
  return t
}

/** `Donation-{artist}-{YYYY-MM-DD}.pdf` using local calendar date (matches typical receipt expectations). */
export function buildDonationPdfAttachmentName(artistDisplayName: string, createdUnix: number): string {
  const d = new Date(createdUnix * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const artist = sanitizeAttachmentArtistSegment(artistDisplayName, 48)
  return `Donation-${artist}-${y}-${m}-${day}.pdf`
}

type SendArgs = {
  to: string
  templateAlias: typeof DONATION_TEMPLATE_ARTIST | typeof DONATION_TEMPLATE_ADMIN
  templateModel: Record<string, unknown>
  pdfBytes: Uint8Array
  pdfFileName: string
}

export async function sendInternalDonationTemplatedEmail({
  to,
  templateAlias,
  templateModel,
  pdfBytes,
  pdfFileName,
}: SendArgs) {
  if (process.env.DISABLE_EMAILS === "true") {
    console.log(`[EMAIL] Email sending disabled. Would send ${templateAlias} to ${to}`)
    return
  }

  if (!postmarkClient) {
    throw new Error("Postmark client not initialized. POSTMARK_SERVER_TOKEN is missing.")
  }

  if (!process.env.POSTMARK_FROM_NAME || !process.env.POSTMARK_FROM_EMAIL) {
    const missing = []
    if (!process.env.POSTMARK_FROM_NAME) missing.push("POSTMARK_FROM_NAME")
    if (!process.env.POSTMARK_FROM_EMAIL) missing.push("POSTMARK_FROM_EMAIL")

    throw new Error(
      `Missing Postmark sender environment variables: ${missing.join(", ")}. ` +
        "Please set both POSTMARK_FROM_NAME and POSTMARK_FROM_EMAIL in your environment.",
    )
  }

  const fromAddress = `${process.env.POSTMARK_FROM_NAME} <${process.env.POSTMARK_FROM_EMAIL}>`

  const attachment = new Attachment(
    pdfFileName,
    Buffer.from(pdfBytes).toString("base64"),
    "application/pdf",
  )

  const message = new TemplatedMessage(fromAddress, templateAlias, templateModel, to)
  message.Attachments = [attachment]

  return await postmarkClient.sendEmailWithTemplate(message)
}
