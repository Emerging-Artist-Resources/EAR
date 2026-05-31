/**
 * Postmark templates: listing-share-festival (performance organizer + multi-day workshop),
 * listing-share-piece (piece inviting primary lister).
 * @see EMAIL_SYSTEM.md
 */

import {
  buildListingSharePieceTemplateModel,
  buildListingShareTemplateModel,
} from "@/lib/email/listing-share-email-model"
import { postmarkClient } from "./postmark"

export type ListingShareTemplateAlias = "listing-share-festival" | "listing-share-piece"

export type ListingShareEmailPayload = {
  to: string
  companyArtistName: string
  eventTitle: string
}

export type ListingShareFestivalEmailArgs = ListingShareEmailPayload & {
  template: "listing-share-festival"
}

export type ListingSharePieceEmailArgs = ListingShareEmailPayload & {
  template: "listing-share-piece"
}

export type ListingShareEmailArgs = ListingShareFestivalEmailArgs | ListingSharePieceEmailArgs

function buildTemplateModel(args: ListingShareEmailArgs): Record<string, string> {
  const payload = {
    companyArtistName: args.companyArtistName,
    eventTitle: args.eventTitle,
  }
  if (args.template === "listing-share-piece") {
    return buildListingSharePieceTemplateModel(payload)
  }
  return buildListingShareTemplateModel(payload)
}

export async function sendListingShareTemplatedEmail(args: ListingShareEmailArgs): Promise<void> {
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

  await postmarkClient.sendEmailWithTemplate({
    From: fromAddress,
    To: args.to,
    TemplateAlias: args.template,
    TemplateModel: buildTemplateModel(args),
  })
}
