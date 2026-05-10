/**
 * Postmark templates: listing-share-festival (performance organizer + multi-day workshop),
 * listing-share-piece (piece).
 * @see EMAIL_SYSTEM.md
 */

import { getPublicAppUrl } from "@/lib/app-url"
import { postmarkClient } from "./postmark"

export type ListingShareTemplateAlias = "listing-share-festival" | "listing-share-piece"

export async function sendListingShareTemplatedEmail(args: {
  template: ListingShareTemplateAlias
  to: string
  listingTitle: string
  listingId: string
  inviterName: string
  inviterEmail: string
}): Promise<void> {
  if (process.env.DISABLE_EMAILS === "true") {
    console.log(`[EMAIL] Email sending disabled. Would send ${args.template} to ${args.to}`)
    return
  }

  if (!postmarkClient) {
    throw new Error(
      "Postmark client not initialized. POSTMARK_SERVER_TOKEN is missing."
    )
  }

  if (!process.env.POSTMARK_FROM_NAME || !process.env.POSTMARK_FROM_EMAIL) {
    const missing = []
    if (!process.env.POSTMARK_FROM_NAME) missing.push("POSTMARK_FROM_NAME")
    if (!process.env.POSTMARK_FROM_EMAIL) missing.push("POSTMARK_FROM_EMAIL")
    throw new Error(
      `Missing Postmark sender environment variables: ${missing.join(", ")}.`
    )
  }

  const fromAddress = `${process.env.POSTMARK_FROM_NAME} <${process.env.POSTMARK_FROM_EMAIL}>`
  const baseUrl = getPublicAppUrl()
  const publicCalendarUrl = `${baseUrl}/calendar?listingId=${encodeURIComponent(args.listingId)}`

  await postmarkClient.sendEmailWithTemplate({
    From: fromAddress,
    To: args.to,
    TemplateAlias: args.template,
    TemplateModel: {
      listing_title: args.listingTitle,
      public_calendar_url: publicCalendarUrl,
      inviter_name: args.inviterName,
      inviter_email: args.inviterEmail,
      platform_name: "EAR",
    },
  })
}
