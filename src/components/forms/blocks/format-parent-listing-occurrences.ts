import { convertUTCToEST } from "@/lib/datetime/utils"
import { inferLocationModeFromStored, type LocationMode } from "@/lib/location/mode"

/** Parent listing occurrence row as returned by GET /api/events/:id */
export type ParentListingOccurrenceRow = {
  starts_at_utc: string
  ends_at_utc?: string | null
  address?: string | null
  place_id?: string | null
  lat?: number | null
  lng?: number | null
  venue_name?: string | null
  location_instructions?: string | null
}

/** Form occurrence shape used by PieceOccurrencesPicker + buildPerformancePayload location lookup. */
export type ParentOccurrenceFormRow = {
  date: string
  times: Array<{
    time: string
    venueName?: string
    address?: string
    placeId?: string
    lat?: number
    lng?: number
    locationInstructions?: string
  }>
  locationMode?: LocationMode
  venueName?: string
  address?: string
  placeId?: string
  lat?: number
  lng?: number
  locationInstructions?: string
}

/**
 * Groups parent listing_occurrences into the form date/times shape so selectedSlots
 * can resolve venue/address when building the piece payload.
 */
export function formatParentListingOccurrencesForForm(
  listingOccurrences: ParentListingOccurrenceRow[],
): ParentOccurrenceFormRow[] {
  const occurrencesByDate = new Map<
    string,
    Array<ParentOccurrenceFormRow["times"][number]>
  >()

  for (const occ of listingOccurrences) {
    if (!occ.starts_at_utc) continue

    const { date: dateStr, time: estTimeStr } = convertUTCToEST(occ.starts_at_utc)

    if (!occurrencesByDate.has(dateStr)) {
      occurrencesByDate.set(dateStr, [])
    }

    occurrencesByDate.get(dateStr)!.push({
      time: estTimeStr,
      venueName: occ.venue_name || undefined,
      address: occ.address || undefined,
      placeId: occ.place_id || undefined,
      lat: occ.lat || undefined,
      lng: occ.lng || undefined,
      locationInstructions: occ.location_instructions || undefined,
    })
  }

  return Array.from(occurrencesByDate.entries()).map(([date, times]) => ({
    date,
    times,
    locationMode: inferLocationModeFromStored({ venueName: times[0]?.venueName }),
    venueName: times[0]?.venueName,
    address: times[0]?.address,
    placeId: times[0]?.placeId,
    lat: times[0]?.lat,
    lng: times[0]?.lng,
    locationInstructions: times[0]?.locationInstructions,
  }))
}
