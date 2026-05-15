/**
 * Public listing / calendar UI: map organizer_program_pieces JSON to display shapes
 * (e.g. ListingCard) aligned with PieceOccurrencesPicker slot keys `YYYY-MM-DD|HH:mm` in EST.
 */

import { convertESTToUTC, convertUTCToEST } from "@/lib/datetime-utils"
import type { OrganizerProgramPiecePersisted } from "@/lib/organizer-program-pieces"
import type { PublicListingDetail } from "@/components/calendar/PublicListingDetailSections"

const EST_TZ = "America/New_York"

export type OrganizerListingOccurrenceLike = {
  id: string
  starts_at_utc: string
  ends_at_utc: string | null
  tz: string
  occurrence_type?: string | null
}

export function organizerSlotKeyFromListingOccurrence(startsAtUtc: string): string {
  const { date, time } = convertUTCToEST(startsAtUtc)
  return `${date}|${time}`
}

/**
 * Occurrences to show for an embedded organizer piece: parent showtimes matching
 * `selected_slots`, plus any custom `extra_occurrences` rows (EST date/time → UTC).
 */
export function buildOccurrencesForOrganizerProgramPiece(
  piece: OrganizerProgramPiecePersisted,
  listingOccurrences:
    | Array<{
        id: string
        starts_at_utc: string
        ends_at_utc?: string | null
        tz?: string | null
        occurrence_type?: string | null
      }>
    | undefined,
): OrganizerListingOccurrenceLike[] {
  const events = (listingOccurrences ?? []).filter(
    (o) => !o.occurrence_type || o.occurrence_type === "event",
  )
  const slotSet = new Set((piece.selected_slots ?? []).map((s) => s.trim()).filter(Boolean))

  const fromParent: OrganizerListingOccurrenceLike[] = []
  if (slotSet.size > 0) {
    for (const occ of events) {
      const key = organizerSlotKeyFromListingOccurrence(occ.starts_at_utc)
      if (slotSet.has(key)) {
        fromParent.push({
          id: occ.id,
          starts_at_utc: occ.starts_at_utc,
          ends_at_utc: occ.ends_at_utc ?? null,
          tz: typeof occ.tz === "string" && occ.tz.trim() !== "" ? occ.tz : EST_TZ,
          occurrence_type: occ.occurrence_type,
        })
      }
    }
  }

  const fromExtras: OrganizerListingOccurrenceLike[] = []
  const extras = piece.extra_occurrences
  if (Array.isArray(extras)) {
    let idx = 0
    for (const row of extras) {
      if (!row || typeof row !== "object") continue
      const date = (row as { date?: string }).date?.trim()
      const times = (row as { times?: Array<{ time?: string }> }).times
      if (!date || !Array.isArray(times)) continue
      for (const t of times) {
        const time = t?.time?.trim()
        if (!time) continue
        idx += 1
        fromExtras.push({
          id: `organizer-extra-${piece.id}-${idx}`,
          starts_at_utc: convertESTToUTC(date, time),
          ends_at_utc: null,
          tz: EST_TZ,
        })
      }
    }
  }

  const merged = [...fromParent, ...fromExtras]
  merged.sort((a, b) => new Date(a.starts_at_utc).getTime() - new Date(b.starts_at_utc).getTime())

  const seen = new Set<string>()
  return merged.filter((o) => {
    if (seen.has(o.starts_at_utc)) return false
    seen.add(o.starts_at_utc)
    return true
  })
}

export function firstOrganizerPiecePhotoUrl(
  piece: OrganizerProgramPiecePersisted,
): string | null {
  const photos = [...(piece.photos ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  )
  for (const ph of photos) {
    const u = (ph as { url?: string | null }).url
    if (typeof u === "string" && u.trim() !== "") return u
  }
  return null
}

export function firstOrganizerPiecePhotoCredit(
  piece: OrganizerProgramPiecePersisted,
): string | null {
  const photos = [...(piece.photos ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  )
  for (const ph of photos) {
    const c = ph.credit?.trim()
    if (c) return c
  }
  return null
}

export function organizerProgramPieceDisplayTitle(
  piece: OrganizerProgramPiecePersisted,
): string {
  return (piece.title || piece.company || "Program piece").trim() || "Program piece"
}

/** Map embedded JSONB piece → `piece_details` shape for `PieceDetails` UI. */
export function organizerProgramPieceToPieceDetails(
  piece: OrganizerProgramPiecePersisted,
  parentEventName?: string | null,
): NonNullable<PublicListingDetail["piece_details"]> {
  return {
    parent_listing_id: null,
    parent_event_name: parentEventName?.trim() ? parentEventName.trim() : null,
    piece_title: piece.title?.trim() ? piece.title.trim() : null,
    piece_company: piece.company?.trim() ? piece.company.trim() : null,
    piece_company_website: piece.company_website,
    piece_description: piece.description?.trim() ? piece.description.trim() : null,
    choreographer: piece.choreographer,
  }
}

export function organizerProgramPiecePhotosForDisplay(
  piece: OrganizerProgramPiecePersisted,
): Array<{
  id: string
  path: string
  credit?: string | null
  sort_order?: number
  url?: string | null
}> {
  return [...(piece.photos ?? [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((ph, idx) => ({
      id: `${piece.id}-photo-${idx}`,
      path: ph.path,
      credit: ph.credit ?? null,
      sort_order: ph.sort_order ?? idx,
      url: ph.url ?? null,
    }))
    .filter((ph) => ph.path)
}
