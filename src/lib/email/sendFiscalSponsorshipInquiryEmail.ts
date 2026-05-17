/**
 * Fiscal sponsorship inquiry — Postmark templates + PDF attachment.
 */

import { Attachment, TemplatedMessage } from "postmark"
import { postmarkClient } from "./postmark"

export const FISCAL_SPONSORSHIP_INQUIRY_TEMPLATE_ADMIN = "fiscal-sponsorship-inquiry-admin"
export const FISCAL_SPONSORSHIP_INQUIRY_TEMPLATE_CONFIRMATION =
  "fiscal-sponsorship-inquiry-confirmation"

type SendArgs = {
  to: string
  templateAlias:
    | typeof FISCAL_SPONSORSHIP_INQUIRY_TEMPLATE_ADMIN
    | typeof FISCAL_SPONSORSHIP_INQUIRY_TEMPLATE_CONFIRMATION
  templateModel: Record<string, unknown>
  pdfBytes: Uint8Array
  pdfFileName: string
}

export async function sendFiscalSponsorshipInquiryTemplatedEmail({
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
      `Missing Postmark sender environment variables: ${missing.join(", ")}.`,
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
