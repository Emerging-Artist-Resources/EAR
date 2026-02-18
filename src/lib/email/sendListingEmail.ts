/**
 * Listing Email Functions
 * 
 * Sends transactional emails for listing-related events using Postmark.
 * 
 * For documentation on adding new email types, see: EMAIL_SYSTEM.md
 * 
 * @see EMAIL_SYSTEM.md for setup, usage, and best practices
 */

import { postmarkClient } from "./postmark"

type ListingEmailType = "listing-received" | "listing-updated" | "admin-listing-received"

type SendListingEmailArgs = {
  to: string
  submitterName: string
  listingTitle: string
  listingId: string
  submitterEmail?: string
}

export async function sendListingEmail(
  type: ListingEmailType,
  {
    to,
    submitterName,
    listingTitle,
    listingId,
    submitterEmail,
  }: SendListingEmailArgs
) {
  if (process.env.DISABLE_EMAILS === "true") {
    console.log(`[EMAIL] Email sending disabled. Would send ${type} to ${to}`)
    return
  }

  if (!postmarkClient) {
    throw new Error(
      "Postmark client not initialized. POSTMARK_TRANSACTIONAL_TOKEN is missing."
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://eararts.org"
  if (!process.env.POSTMARK_FROM_NAME || !process.env.POSTMARK_FROM_EMAIL) {
    const missing = []
    if (!process.env.POSTMARK_FROM_NAME) missing.push("POSTMARK_FROM_NAME")
    if (!process.env.POSTMARK_FROM_EMAIL) missing.push("POSTMARK_FROM_EMAIL")
    
    throw new Error(
      `Missing Postmark sender environment variables: ${missing.join(", ")}. ` +
      "Please set both POSTMARK_FROM_NAME and POSTMARK_FROM_EMAIL in your environment."
    )
  }
  
  const fromAddress = `${process.env.POSTMARK_FROM_NAME} <${process.env.POSTMARK_FROM_EMAIL}>`

  const templateModel: Record<string, string> = {
    submitter_name: submitterName,
    listing_title: listingTitle,
    cta_url: `${baseUrl}/dashboard/listings/${listingId}`,
  }

  if (submitterEmail) {
    templateModel.submitter_email = submitterEmail
  }

  const emailData = {
    From: fromAddress,
    To: to,
    TemplateAlias: type,
    TemplateModel: templateModel,
  }

  return await postmarkClient.sendEmailWithTemplate(emailData)
}
