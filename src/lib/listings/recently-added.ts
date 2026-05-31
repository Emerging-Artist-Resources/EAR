import { subDays } from "date-fns"

/**
 * How far back "Recently Added" listings go (by `submitted_at`, inclusive of this cutoff).
 * Change here to update calendar + API behavior in one place.
 */
export const RECENTLY_ADDED_MAX_AGE_DAYS = 7

export function getRecentlyAddedCutoff(now: Date = new Date()): Date {
  return subDays(now, RECENTLY_ADDED_MAX_AGE_DAYS)
}

export function isSubmittedWithinLastDays(
  submittedAt: string | Date | null | undefined,
  days: number = RECENTLY_ADDED_MAX_AGE_DAYS,
  now: Date = new Date()
): boolean {
  if (submittedAt == null) return false
  const t = typeof submittedAt === "string" ? new Date(submittedAt) : submittedAt
  if (Number.isNaN(t.getTime())) return false
  return t >= subDays(now, days)
}

export function filterBySubmittedWithinLastDays<T extends { submitted_at: string }>(
  listings: T[],
  days: number = RECENTLY_ADDED_MAX_AGE_DAYS,
  now: Date = new Date()
): T[] {
  return listings.filter((l) => isSubmittedWithinLastDays(l.submitted_at, days, now))
}
