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

/** Parent workshop listing (not a class linked to a workshop). */
export function isOrganizerWorkshopListing(
  listing: PublicListingDetail | null | undefined,
): boolean {
  if (!listing || listing.type !== "class") return false
  const cwd = normalizeListingRelation(listing.class_workshop_details)
  if (!cwd || cwd.class_workshop_type !== "WORKSHOP") return false
  return cwd.parent_listing_id == null
}

/** Standalone class or class linked to a workshop (not a workshop listing). */
export function isClassListingDetail(
  listing: PublicListingDetail | null | undefined,
): boolean {
  if (!listing || listing.type !== "class") return false
  const cwd = normalizeListingRelation(listing.class_workshop_details)
  return cwd?.class_workshop_type === "CLASS"
}

export function isAuditionListingDetail(
  listing: PublicListingDetail | null | undefined,
): boolean {
  return listing?.type === "audition"
}

export function isOpportunityListingDetail(
  listing: PublicListingDetail | null | undefined,
): boolean {
  return listing?.type === "creative"
}

/** Host or individual name for listing cards (recent feed, piece/class cards, etc.). */
export function getListingCardHost(listing: PublicListingDetail): string | null {
  const normalized = normalizePublicListingRelations(listing)

  if (isPiecePerformanceListing(normalized)) {
    const piece = normalizeListingRelation(normalized.piece_details)
    return (
      piece?.piece_company?.trim() ||
      piece?.choreographer?.trim() ||
      null
    )
  }

  if (normalized.type === "performance") {
    const perf = normalizeListingRelation(normalized.performance_details)
    return perf?.organizer?.trim() || listing.company?.trim() || null
  }

  if (normalized.type === "audition") {
    const audition = normalizeListingRelation(normalized.audition_details)
    return audition?.host?.trim() || null
  }

  if (normalized.type === "creative") {
    const creative = normalizeListingRelation(normalized.creative_details)
    return creative?.host?.trim() || null
  }

  if (normalized.type === "class") {
    const cwd = normalizeListingRelation(normalized.class_workshop_details)
    if (cwd?.class_workshop_type === "CLASS") {
      return cwd.organizer?.trim() || cwd.teachers?.trim() || null
    }
    return cwd?.organizer?.trim() || listing.company?.trim() || null
  }

  return null
}

/** Short description for listing cards. */
export function getListingCardDescription(listing: PublicListingDetail): string | null {
  const normalized = normalizePublicListingRelations(listing)

  if (isPiecePerformanceListing(normalized)) {
    const piece = normalizeListingRelation(normalized.piece_details)
    return piece?.piece_description?.trim() || null
  }

  if (normalized.type === "performance") {
    const perf = normalizeListingRelation(normalized.performance_details)
    return perf?.description?.trim() || null
  }

  if (normalized.type === "audition") {
    const audition = normalizeListingRelation(normalized.audition_details)
    return audition?.description?.trim() || null
  }

  if (normalized.type === "creative") {
    const creative = normalizeListingRelation(normalized.creative_details)
    return creative?.description?.trim() || null
  }

  if (normalized.type === "class") {
    const cwd = normalizeListingRelation(normalized.class_workshop_details)
    return cwd?.description?.trim() || null
  }

  return null
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
