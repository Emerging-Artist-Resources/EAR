import { format, startOfMonth, endOfMonth } from "date-fns"
import type { CalendarItem } from "@/hooks/use-calendar"
import { convertUTCToEST } from "@/lib/datetime-utils"

type PerfLike = CalendarItem | (CalendarItem & { [key: string]: unknown })

function asRecord(val: unknown): Record<string, unknown> | null {
  return val && typeof val === 'object' && !Array.isArray(val) ? (val as Record<string, unknown>) : null
}

function getFrom(rec: Record<string, unknown> | null, key: string): unknown {
  return rec ? rec[key] : undefined
}

function getEventType(p: PerfLike): string | undefined {
  const prec = asRecord(p)
  const details = asRecord(getFrom(prec, 'details'))
  const val = getFrom(prec, 'eventType') ?? getFrom(prec, 'event_type') ?? getFrom(details, 'eventType') ?? getFrom(details, 'event_type')
  return typeof val === 'string' ? val : undefined
}

function getOpportunitySubtype(p: PerfLike): string | undefined {
  const prec = asRecord(p)
  const details = asRecord(getFrom(prec, 'details'))
  const val = getFrom(details, 'opportunityType') ?? getFrom(prec, 'opportunityType')
  return typeof val === 'string' ? val : undefined
}

export function filterCalendarItems(items: CalendarItem[], selectedTypes: Set<string>): CalendarItem[] {
  if (selectedTypes.size === 0) {
    return []
  }

  const allTypesSelected = selectedTypes.has('PERFORMANCE') && 
                           selectedTypes.has('CLASS') && 
                           selectedTypes.has('AUDITION') && 
                           selectedTypes.has('CREATIVE')
  
  if (allTypesSelected) {
    return items
  }

  return items.filter((item) => {
    const typeUpper = item.type.toUpperCase()
    return selectedTypes.has(typeUpper)
  })
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
