import { format, startOfMonth, endOfMonth } from "date-fns"
import type { CalendarItem } from "@/hooks/use-calendar"
import { convertUTCToEST, getTodayESTDateString } from "@/lib/datetime/utils"
import { filterByCalendarListingTypes } from "@/lib/listings/calendar-filter-types"

/** True when the calendar cell date is before today (EST). */
export function isPastCalendarDate(date: Date): boolean {
  return format(date, "yyyy-MM-dd") < getTodayESTDateString()
}

export function filterCalendarItems(items: CalendarItem[], selectedTypes: Set<string>): CalendarItem[] {
  return filterByCalendarListingTypes(items, selectedTypes)
}

export function getItemsForDate(
  filteredItems: CalendarItem[],
  date: Date,
  deduplicate: boolean = false
): CalendarItem[] {
  const targetDateStr = format(date, 'yyyy-MM-dd')
  
  const itemsForDate = filteredItems.filter((item) => {
    const estDate = convertUTCToEST(String(item.start))
    return estDate.date === targetDateStr
  })
  
  if (!deduplicate) {
    return itemsForDate
  }
  
  const seen = new Map<string, CalendarItem>()
  for (const item of itemsForDate) {
    const key = `${item.listingId}-${targetDateStr}`
    if (!seen.has(key)) {
      seen.set(key, item)
    }
  }
  
  return Array.from(seen.values())
}

export function handleMonthChange(
  newDate: Date,
  onMonthChange: ((monthStart: Date, monthEnd: Date) => void) | undefined,
  lastFetchedMonthRef: React.MutableRefObject<string | null>
): void {
  if (!onMonthChange) return
  
  const newMonthStart = startOfMonth(newDate)
  const newMonthEnd = endOfMonth(newDate)
  const newMonthKey = `${newDate.getFullYear()}-${newDate.getMonth()}`
  
  if (lastFetchedMonthRef.current !== newMonthKey) {
    lastFetchedMonthRef.current = newMonthKey
    onMonthChange(newMonthStart, newMonthEnd)
  }
}
