/**
 * Internal donation notifications (artist + admin) via Postmark templates + PDF attachment.
 */

import { Attachment, TemplatedMessage } from "postmark"
import { postmarkClient } from "./postmark"

export const DONATION_TEMPLATE_ARTIST = "donation-notification-artist"
export const DONATION_TEMPLATE_ADMIN = "donation-notification-admin"

type SendArgs = {
  to: string
  templateAlias: typeof DONATION_TEMPLATE_ARTIST | typeof DONATION_TEMPLATE_ADMIN
  templateModel: Record<string, unknown>
  pdfBytes: Uint8Array
}

export async function sendInternalDonationTemplatedEmail({ to, templateAlias, templateModel, pdfBytes }: SendArgs) {
  if (process.env.DISABLE_EMAILS === "true") {
    console.log(`[EMAIL] Email sending disabled. Would send ${templateAlias} to ${to}`)
    return
  }

  if (!postmarkClient) {
    throw new Error("Postmark client not initialized. POSTMARK_TRANSACTIONAL_TOKEN is missing.")
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
    "donation-summary.pdf",
    Buffer.from(pdfBytes).toString("base64"),
    "application/pdf",
  )

  const message = new TemplatedMessage(fromAddress, templateAlias, templateModel, to)
  message.Attachments = [attachment]

  return await postmarkClient.sendEmailWithTemplate(message)
}
