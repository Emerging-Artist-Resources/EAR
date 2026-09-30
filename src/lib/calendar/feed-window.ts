import { addMonths, endOfMonth, format, startOfMonth } from "date-fns"
import { convertESTToUTC } from "@/lib/datetime/utils"

/** Half-open calendar window: inclusive start, exclusive end. */
export type HalfOpenWindow = {
  from: string
  to: string
}

export type CalendarVisibleRange = {
  start: Date
  end: Date
}

const NY_TIMEZONE = "America/New_York"

/** YYYY-MM-DD in America/New_York. */
export function nyDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: NY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export function adjacentMonthKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number)
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1))
  const y = shifted.getUTCFullYear()
  const m = shifted.getUTCMonth() + 1
  return `${y}-${String(m).padStart(2, "0")}`
}

/**
 * America/New_York month as [first instant, first instant of the next month).
 * Adjacent months meet at that instant and do not both include it.
 */
export function monthWindow(monthKey: string): HalfOpenWindow {
  const [year, month] = monthKey.split("-").map(Number)
  const fromKey = `${year}-${String(month).padStart(2, "0")}-01`
  const toKey = `${adjacentMonthKey(monthKey, 1)}-01`
  return {
    from: convertESTToUTC(fromKey, "00:00"),
    to: convertESTToUTC(toKey, "00:00"),
  }
}

export function instantInWindow(iso: string, window: HalfOpenWindow): boolean {
  return iso >= window.from && iso < window.to
}

/** Local calendar months touched by an inclusive visible range. */
export function monthKeysOverlapping(range: CalendarVisibleRange): string[] {
  const keys: string[] = []
  let cursor = startOfMonth(range.start)
  const last = startOfMonth(range.end)
  while (cursor.getTime() <= last.getTime()) {
    keys.push(format(cursor, "yyyy-MM"))
    cursor = addMonths(cursor, 1)
  }
  return keys
}

/** Months just outside the ones on screen, for prefetch. */
export function neighborMonthKeys(monthKeys: string[]): string[] {
  const neighbors = new Set<string>()
  for (const key of monthKeys) {
    neighbors.add(adjacentMonthKey(key, -1))
    neighbors.add(adjacentMonthKey(key, 1))
  }
  for (const key of monthKeys) neighbors.delete(key)
  return [...neighbors]
}

export function monthRangeContaining(date: Date): CalendarVisibleRange {
  return { start: startOfMonth(date), end: endOfMonth(date) }
}

/**
 * Open Opportunities: [start of today in New York, that instant plus three calendar months).
 * Independent of which month the grid is showing.
 */
export function deadlineWindow(now: Date): HalfOpenWindow {
  const today = nyDateKey(now)
  const [year, month, day] = today.split("-").map(Number)
  const from = convertESTToUTC(today, "00:00")
  const end = new Date(Date.UTC(year, month - 1 + 3, day))
  const toKey = `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, "0")}-${String(end.getUTCDate()).padStart(2, "0")}`
  const to = convertESTToUTC(toKey, "00:00")
  return { from, to }
}

export function dedupeCalendarItems<T extends { occurrenceId: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  const deduped: T[] = []
  for (const item of items) {
    if (seen.has(item.occurrenceId)) continue
    seen.add(item.occurrenceId)
    deduped.push(item)
  }
  return deduped
}
