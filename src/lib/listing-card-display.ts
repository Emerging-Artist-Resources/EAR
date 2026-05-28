import type { PublicListingDetail } from "@/components/calendar/PublicListingDetailSections"
import { getGoogleMapsLink } from "@/lib/google-maps-link"
import {
  isOnlineLocationDisplay,
  type LocationDisplaySource,
} from "@/lib/location-display"
import { ONLINE_VENUE_LABEL } from "@/lib/location-mode"
import {
  getListingCardDescription,
  getListingCardHost,
  isAuditionListingDetail,
  isOpportunityListingDetail,
  normalizeListingRelation,
  normalizePublicListingRelations,
} from "@/lib/listing-display"

export type ListingCardOccurrence = {
  id: string
  starts_at_utc: string
  ends_at_utc: string | null
  occurrence_type?: string | null
  tz?: string
}

export type ListingCardVenue = {
  name: string
  mapsUrl: string | null
  isOnline: boolean
}

export type ListingCardLinkDisplay = {
  href?: string
  text: string
}

function pickLocationSource(listing: PublicListingDetail): LocationDisplaySource {
  const events = (listing.listing_occurrences ?? []).filter(
    (o) => o.occurrence_type !== "deadline",
  )
  const fromOccurrence = events.find((o) => (o.venue_name ?? "").trim())
  if (fromOccurrence) return fromOccurrence
  return listing
}

export function getListingCardVenue(listing: PublicListingDetail): ListingCardVenue | null {
  const location = pickLocationSource(listing)
  if (isOnlineLocationDisplay(location)) {
    return { name: ONLINE_VENUE_LABEL, mapsUrl: null, isOnline: true }
  }
  const name = location.venue_name?.trim()
  if (!name || name === ONLINE_VENUE_LABEL) return null
  return {
    name,
    mapsUrl: getGoogleMapsLink(location.address, location.place_id),
    isOnline: false,
  }
}

export function getListingCardPrice(listing: PublicListingDetail): string | null {
  const normalized = normalizePublicListingRelations(listing)

  if (isAuditionListingDetail(normalized) || isOpportunityListingDetail(normalized)) {
    const details =
      normalized.type === "audition"
        ? normalizeListingRelation(normalized.audition_details)
        : normalizeListingRelation(normalized.creative_details)
    const amount = details?.fee_amount?.trim()
    return amount || "No Application Fee"
  }

  if (normalized.type === "performance") {
    const perf = normalizeListingRelation(normalized.performance_details)
    return perf?.price?.trim() || null
  }

  if (normalized.type === "class") {
    const cwd = normalizeListingRelation(normalized.class_workshop_details)
    return cwd?.price?.trim() || null
  }

  return null
}

function isProbablyUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || /^www\./i.test(value)
}

function normalizeUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value}`
}

export function getListingCardLink(listing: PublicListingDetail): ListingCardLinkDisplay | null {
  const normalized = normalizePublicListingRelations(listing)

  if (normalized.type === "performance") {
    const perf = normalizeListingRelation(normalized.performance_details)
    const ticket = perf?.link?.trim()
    if (ticket) {
      return { href: normalizeUrl(ticket), text: ticket }
    }
    return null
  }

  if (normalized.type === "class") {
    const cwd = normalizeListingRelation(normalized.class_workshop_details)
    const registration = cwd?.link?.trim()
    if (registration) {
      return { href: normalizeUrl(registration), text: registration }
    }
    return null
  }

  if (normalized.type === "audition") {
    const ad = normalizeListingRelation(normalized.audition_details)
    const website = ad?.website?.trim()
    if (website) {
      return {
        href: isProbablyUrl(website) ? normalizeUrl(website) : undefined,
        text: website,
      }
    }
    const instructions = ad?.instructions?.trim()
    if (instructions) {
      return { text: instructions }
    }
    return null
  }

  if (normalized.type === "creative") {
    const cd = normalizeListingRelation(normalized.creative_details)
    const link = cd?.link?.trim()
    if (link) {
      return {
        href: isProbablyUrl(link) ? normalizeUrl(link) : undefined,
        text: link,
      }
    }
    const website = cd?.website?.trim()
    if (website) {
      return {
        href: isProbablyUrl(website) ? normalizeUrl(website) : undefined,
        text: website,
      }
    }
    return null
  }

  return null
}

export function splitListingCardOccurrences(occurrences: ListingCardOccurrence[]) {
  const sorted = [...occurrences]
    .filter((o) => o.starts_at_utc)
    .sort(
    (a, b) => new Date(a.starts_at_utc).getTime() - new Date(b.starts_at_utc).getTime(),
  )
  const deadlines = sorted.filter((o) => o.occurrence_type === "deadline")
  const events = sorted.filter((o) => o.occurrence_type !== "deadline")
  return { deadlines, events }
}

export type ListingCardSummary = {
  host: string | null
  description: string | null
  venue: ListingCardVenue | null
  price: string | null
  link: ListingCardLinkDisplay | null
  deadlines: ListingCardOccurrence[]
  events: ListingCardOccurrence[]
}

export function getListingCardSummary(listing: PublicListingDetail): ListingCardSummary {
  const normalized = normalizePublicListingRelations(listing)
  const { deadlines, events } = splitListingCardOccurrences(
    (listing.listing_occurrences ?? []) as ListingCardOccurrence[],
  )

  return {
    host: getListingCardHost(normalized),
    description: getListingCardDescription(normalized),
    venue: getListingCardVenue(normalized),
    price: getListingCardPrice(normalized),
    link: getListingCardLink(normalized),
    deadlines,
    events,
  }
}
