/**
 * Template model fields for listing-share Postmark templates.
 * @see EMAIL_SYSTEM.md
 */

import { getPublicAppUrl } from "@/lib/config/app-url"

export const LISTING_SHARE_SUPPORT_EMAIL = "info@eararts.org"

export type PieceDetailsForShareEmail = {
  piece_company?: string | null
  choreographer?: string | null
  parent_event_name?: string | null
  parent_listing_id?: string | null
}

export type PerformanceDetailsForShareEmail = {
  title?: string | null
}

const LISTING_SHARE_INVITER_FALLBACK = "An artist"

/** Company / artist name shown to the invited organizer (piece flow). */
export function resolveCompanyArtistName(args: {
  pieceDetails: PieceDetailsForShareEmail | null
  contactName: string | null | undefined
}): string {
  const fromPiece =
    args.pieceDetails?.piece_company?.trim() || args.pieceDetails?.choreographer?.trim()
  if (fromPiece) return fromPiece
  const fromContact = args.contactName?.trim()
  if (fromContact) return fromContact
  return LISTING_SHARE_INVITER_FALLBACK
}

/** Company / artist name shown to invited participating artists (festival / organizer flow). */
export function resolveFestivalCompanyArtistName(args: {
  organizerName?: string | null
  company?: string | null
  contactName?: string | null
}): string {
  const fromOrganizer = args.organizerName?.trim()
  if (fromOrganizer) return fromOrganizer
  const fromCompany = args.company?.trim()
  if (fromCompany) return fromCompany
  const fromContact = args.contactName?.trim()
  if (fromContact) return fromContact
  return LISTING_SHARE_INVITER_FALLBACK
}

/** Event title for the parent performance (piece invite flow). */
export function resolvePieceEventTitle(args: {
  pieceDetails: PieceDetailsForShareEmail | null
  performanceDetails: PerformanceDetailsForShareEmail | null
  parentPerformanceTitle?: string | null
}): string {
  const manualParent = args.pieceDetails?.parent_event_name?.trim()
  if (manualParent) return manualParent

  const linkedParent = args.parentPerformanceTitle?.trim()
  if (linkedParent) return linkedParent

  const pieceListingTitle = args.performanceDetails?.title?.trim()
  if (pieceListingTitle) return pieceListingTitle

  return "this performance"
}

export function buildSubmitListingUrl(): string {
  return `${getPublicAppUrl()}/forms`
}

export function buildListingShareTemplateModel(args: {
  companyArtistName: string
  eventTitle: string
}): Record<string, string> {
  return {
    company_artist_name: args.companyArtistName,
    event_title: args.eventTitle,
    submit_listing_url: buildSubmitListingUrl(),
  }
}

export function buildListingSharePieceTemplateModel(args: {
  companyArtistName: string
  eventTitle: string
}): Record<string, string> {
  return {
    ...buildListingShareTemplateModel(args),
    support_email: LISTING_SHARE_SUPPORT_EMAIL,
  }
}
