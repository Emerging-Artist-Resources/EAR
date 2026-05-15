import { hasCompleteLocation, type LocationFormFields } from "@/lib/location-mode"

/**
 * Shared rules for one occurrence / showtime row: location + (optional) time gating
 * for organizer list UI and Zod superRefine, so copy stays in sync.
 */

export const ORGANIZER_OCCURRENCE_USER_MESSAGES = {
  /** addIssue on occurrences when nothing usable yet */
  needSchedule: "Add at least one showtime with a date, a time, and a location.",
  /** SPLIT_BILL / FESTIVAL: must confirm showtimes before continuing */
  confirmSchedule: "Confirm your event dates and locations before continuing.",
  /** Piece links to parent slots before festival schedule is confirmed */
  confirmBeforePieceSlots: "Confirm the event schedule above before linking this piece to dates.",
  /** Piece selected slot not in organizer occurrence list */
  pieceSlotsMustMatch: "Each selected time must match a showtime from your event schedule above.",
  /** Piece custom ShowtimesList rows incomplete */
  pieceCustomScheduleIncomplete:
    "Complete every custom date & time for this piece (including location), or remove empty rows.",
  /** addIssue on occurrences.n.address when location missing */
  locationOnSubmit: "Select a location for this showtime — use search to pick a venue or address on the map.",
  locationOnlineOnSubmit: "Add how to attend online for this showtime.",
  /** setError in UI when user adds another showtime without finishing the row above */
  addAnotherNeedDate: "Add a date for this showtime before you add another.",
  addAnotherNeedTime: "Add a time for every slot in this showtime before you add another.",
  addAnotherNeedLocation: "Choose a location before you add another showtime — search the map or type a venue or address.",
  addAnotherNeedOnlineDetails: "Add how to attend online before you add another showtime.",
} as const

export type OccurrenceLike = LocationFormFields & {
  date?: string
  times?: { time?: string }[]
}

export function hasPerOccurrenceLocation(entry: OccurrenceLike | undefined): boolean {
  return hasCompleteLocation(entry)
}

/** Matches Zod: at least one time row, and every listed time is non-empty. */
export function occurrenceRowHasAllTimesFilled(entry: OccurrenceLike | undefined, requireTime: boolean): boolean {
  if (!requireTime) return true
  if (!Array.isArray(entry?.times) || entry.times.length === 0) return false
  return entry.times.every((t) => (t?.time ?? "").trim() !== "")
}

/** A row is “in use” for location rules when date is set and all times (if any) are valid per schema. */
export function occurrenceRowDateAndTimesSatisfied(
  entry: OccurrenceLike | undefined,
  requireTime: boolean,
): boolean {
  if (!entry?.date?.trim()) return false
  if (!requireTime) return true
  return occurrenceRowHasAllTimesFilled(entry, true)
}

/**
 * Organizer per-row completion: date, (optional) all times, and optionally a location identifier.
 * Used to gate “Confirm showtimes”, “+ Add another showtime”, and align with zod for submit.
 * When `requireLocation` is false (e.g. audition / deadline-only rows), location is not checked.
 */
export function isOrganizerOccurrenceRowComplete(
  entry: OccurrenceLike | undefined,
  options: { requireTime: boolean; requireLocation?: boolean },
): boolean {
  if (!occurrenceRowDateAndTimesSatisfied(entry, options.requireTime)) return false
  if (options.requireLocation === false) return true
  return hasPerOccurrenceLocation(entry)
}

/** True when the array is non-empty and every row is complete. */
export function isEveryOrganizerOccurrenceRowComplete(
  entries: OccurrenceLike[] | undefined,
  requireTime: boolean,
  requireLocation?: boolean,
): boolean {
  if (!entries || entries.length === 0) return false
  return entries.every((e) => isOrganizerOccurrenceRowComplete(e, { requireTime, requireLocation }))
}

/** Rows that are “started” in the sense the server cares about, but still missing address/venue/place. */
export function indexOfOrganizerRowsMissingLocation(
  entries: OccurrenceLike[] | undefined,
  requireTime: boolean,
): number[] {
  if (!entries) return []
  return entries
    .map((occ, index) => ({ occ, index }))
    .filter(
      ({ occ }) => occurrenceRowDateAndTimesSatisfied(occ, requireTime) && !hasPerOccurrenceLocation(occ),
    )
    .map(({ index }) => index)
}

/** At least one row is fully valid for the coarse “add something” check. */
export function hasSomeCompleteOrganizerOccurrence(
  entries: OccurrenceLike[] | undefined,
  requireTime: boolean,
  requireLocation?: boolean,
): boolean {
  if (!entries?.length) return false
  return entries.some((e) => isOrganizerOccurrenceRowComplete(e, { requireTime, requireLocation }))
}

/**
 * Slot keys aligned with PieceOccurrencesPicker: `${date}|${time}` per time row.
 */
export function buildOrganizerOccurrenceSlotKeySet(entries: OccurrenceLike[] | undefined): Set<string> {
  const set = new Set<string>()
  if (!entries?.length) return set
  for (const ex of entries) {
    const date = (ex?.date ?? "").trim()
    if (!date) continue
    const times = ex.times
    if (!Array.isArray(times)) continue
    for (const t of times) {
      const time = (t?.time ?? "").trim()
      if (time) set.add(`${date}|${time}`)
    }
  }
  return set
}
