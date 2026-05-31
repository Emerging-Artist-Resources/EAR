import { OPPORTUNITY_LISTING_TYPE_LABEL } from "./type-labels"

export const CALENDAR_FILTER_TYPES = ["PERFORMANCE", "CLASS", "AUDITION", "CREATIVE"] as const

export type CalendarFilterType = (typeof CALENDAR_FILTER_TYPES)[number]

export const CALENDAR_FILTER_TYPE_LABELS: Record<CalendarFilterType, string> = {
  PERFORMANCE: "Performance",
  CLASS: "Class/Workshop",
  AUDITION: "Audition",
  CREATIVE: OPPORTUNITY_LISTING_TYPE_LABEL,
}

export function isAllCalendarFilterTypesSelected(selectedTypes: Set<string>): boolean {
  return CALENDAR_FILTER_TYPES.every((t) => selectedTypes.has(t))
}

export function filterByCalendarListingTypes<T extends { type: string }>(
  items: T[],
  selectedTypes: Set<string>,
): T[] {
  if (selectedTypes.size === 0) {
    return []
  }

  if (isAllCalendarFilterTypesSelected(selectedTypes)) {
    return items
  }

  return items.filter((item) => selectedTypes.has(item.type.toUpperCase()))
}
