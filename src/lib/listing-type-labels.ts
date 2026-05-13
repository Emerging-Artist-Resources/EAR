/**
 * User-facing label for listings stored as DB type `creative` / wizard `CREATIVE`.
 * Use wherever this listing type is shown (filters, badges, selectors, profile).
 */
export const OPPORTUNITY_LISTING_TYPE_LABEL = "Opportunity" as const

export const UNTITLED_OPPORTUNITY_TITLE = "Untitled Opportunity" as const

/** Lowercase API / DB listing `type` → short label for cards and modals. */
export const CALENDAR_LISTING_TYPE_LABELS = {
  performance: "Performance",
  audition: "Audition",
  creative: OPPORTUNITY_LISTING_TYPE_LABEL,
  class: "Class/Workshop",
} as const

export type CalendarListingTypeKey = keyof typeof CALENDAR_LISTING_TYPE_LABELS

export function getCalendarListingTypeLabel(type: string): string {
  if (type in CALENDAR_LISTING_TYPE_LABELS) {
    return CALENDAR_LISTING_TYPE_LABELS[type as CalendarListingTypeKey]
  }
  return type
}
