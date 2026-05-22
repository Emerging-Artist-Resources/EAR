import type { PublicListingDetail } from "@/components/calendar/PublicListingDetailSections"

/** True when a string field has non-whitespace content suitable for public display. */
export function hasDisplayText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0
}

/** Supabase may return 1:1 relations as an object or a single-element array. */
export function normalizeListingRelation<T>(data: T | T[] | null | undefined): T | null {
  if (!data) return null
  if (Array.isArray(data)) {
    return data[0] ?? null
  }
  return data
}

export function normalizePublicListingRelations(
  listing: PublicListingDetail,
): PublicListingDetail {
  return {
    ...listing,
    performance_details: normalizeListingRelation(listing.performance_details),
    piece_details: normalizeListingRelation(listing.piece_details),
    audition_details: normalizeListingRelation(listing.audition_details),
    creative_details: normalizeListingRelation(listing.creative_details),
    class_workshop_details: normalizeListingRelation(listing.class_workshop_details),
  }
}

/** True when listing is a performance piece (standalone child listing or PIECE subtype). */
export function isPiecePerformanceListing(
  listing: PublicListingDetail | null | undefined,
): boolean {
  if (!listing || listing.type !== "performance") return false

  const perf = normalizeListingRelation(listing.performance_details)
  if (perf?.subtype === "PIECE") return true

  const piece = normalizeListingRelation(listing.piece_details)
  if (!piece) return false

  return (
    hasDisplayText(piece.piece_title) ||
    hasDisplayText(piece.piece_company) ||
    hasDisplayText(piece.piece_description) ||
    hasDisplayText(piece.choreographer) ||
    piece.parent_listing_id != null ||
    hasDisplayText(piece.parent_event_name)
  )
}

export function isOrganizerPerformanceListing(
  listing: PublicListingDetail | null | undefined,
): boolean {
  if (!listing || listing.type !== "performance") return false
  if (isPiecePerformanceListing(listing)) return false
  const perf = normalizeListingRelation(listing.performance_details)
  return perf?.subtype === "ORGANIZER"
}

export function hasSocialHandlesContent(socialHandles: unknown): boolean {
  if (!socialHandles) return false
  let handles: Record<string, string> | null = null
  if (typeof socialHandles === "string") {
    try {
      handles = JSON.parse(socialHandles) as Record<string, string>
    } catch {
      return socialHandles.trim().length > 0
    }
  } else if (typeof socialHandles === "object" && socialHandles !== null) {
    handles = socialHandles as Record<string, string>
  }
  return Boolean(handles && Object.keys(handles).length > 0)
}
