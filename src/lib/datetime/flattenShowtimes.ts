// src/lib/datetime/flattenShowtimes.ts

export type DateKey = string // "YYYY-MM-DD"
export type TimesByDate = Record<DateKey, string[]> // times as "HH:mm"

export type Showtime = {
  date: DateKey
  start_time: string // "HH:mm"
  venue_id?: string
}

/**
 * Flattens:
 *  - showDates: ["2026-01-10", "2026-01-11"]
 *  - timesByDate: { "2026-01-10": ["14:00","19:00"], "2026-01-11": ["15:00"] }
 * into:
 *  - [{date:"2026-01-10", start_time:"14:00"}, ...]
 *
 * Notes:
 * - Uses showDates as the source of truth for which dates exist
 * - Removes invalid/empty times
 * - Dedupes (date+time) pairs
 * - Sorts by date, then time
 */
export function flattenShowtimes(
  showDates: DateKey[] | undefined,
  timesByDate: TimesByDate | undefined,
  venueId?: string
): Showtime[] {
  const dates = Array.isArray(showDates) ? showDates : []
  const map = timesByDate && typeof timesByDate === "object" ? timesByDate : {}

  const out: Showtime[] = []
  const seen = new Set<string>()

  for (const date of dates) {
    const times = Array.isArray(map[date]) ? map[date] : []
    for (const t of times) {
      const time = typeof t === "string" ? t.trim() : ""
      if (!/^\d{2}:\d{2}$/.test(time)) continue

      const key = `${date}__${time}`
      if (seen.has(key)) continue
      seen.add(key)

      out.push({
        date,
        start_time: time,
        ...(venueId ? { venue_id: venueId } : {}),
      })
    }
  }

  out.sort((a: { date: string; start_time: string }, b: { date: string; start_time: string }) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    if (a.start_time !== b.start_time) return a.start_time < b.start_time ? -1 : 1
    return 0
  })

  return out
}
