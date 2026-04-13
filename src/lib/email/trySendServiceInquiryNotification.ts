import { Message } from "postmark"
import { postmarkClient } from "@/lib/email/postmark"

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * Sends a simple internal HTML email when a service inquiry is submitted.
 */
export async function trySendServiceInquiryNotification(params: {
  inquiryId: string
  serviceTitle: string
  serviceSlug: string
  name: string
  email: string
  answersHtml: string
}): Promise<void> {
  if (process.env.DISABLE_EMAILS === "true") {
    console.log(`[EMAIL] Service inquiry notification skipped (DISABLE_EMAILS) inquiryId=${params.inquiryId}`)
    return
  }

  const adminEmailRaw = process.env.ADMIN_EMAIL ?? process.env.ADMIN_NOTIFICATION_EMAIL ?? ""
  const adminEmail = adminEmailRaw.trim()
  if (!adminEmail) {
    console.warn("[EMAIL] ADMIN_EMAIL / ADMIN_NOTIFICATION_EMAIL not set; skipping service inquiry notification")
    return
  }

  if (!postmarkClient) {
    console.warn("[EMAIL] Postmark not configured; skipping service inquiry notification")
    return
  }

  if (!process.env.POSTMARK_FROM_NAME || !process.env.POSTMARK_FROM_EMAIL) {
    console.warn("[EMAIL] POSTMARK_FROM_* not set; skipping service inquiry notification")
    return
  }

  const fromAddress = `${process.env.POSTMARK_FROM_NAME} <${process.env.POSTMARK_FROM_EMAIL}>`
  const subject = `New inquiry: ${params.serviceTitle}`

  const body = `
    <p><strong>Service:</strong> ${escapeHtml(params.serviceTitle)} (${escapeHtml(params.serviceSlug)})</p>
    <p><strong>Inquiry ID:</strong> ${escapeHtml(params.inquiryId)}</p>
    <p><strong>Name:</strong> ${escapeHtml(params.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(params.email)}</p>
    <hr />
    <h2>Answers</h2>
    ${params.answersHtml}
  `

  /** Postmark `Message` ctor: From, Subject, HtmlBody, TextBody, To, ... */
  const message = new Message(fromAddress, subject, body, undefined, adminEmail)

  try {
    await postmarkClient.sendEmail(message)
  } catch (e) {
    console.error("[EMAIL] Failed to send service inquiry notification", e)
  }
}
