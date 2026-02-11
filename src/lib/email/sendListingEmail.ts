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

type ListingEmailType = "listing-received" | "listing-updated"

type SendListingEmailArgs = {
  to: string
  submitterName: string
  listingTitle: string
  listingId: string
}

export async function sendListingEmail(
  type: ListingEmailType,
  {
    to,
    submitterName,
    listingTitle,
    listingId,
  }: SendListingEmailArgs
) {
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

  const emailData = {
    From: fromAddress,
    To: to,
    TemplateAlias: type,
    TemplateModel: {
      submitter_name: submitterName,
      listing_title: listingTitle,
      cta_url: `${baseUrl}/dashboard/listings/${listingId}`,
    },
  }

  return await postmarkClient.sendEmailWithTemplate(emailData)
}
