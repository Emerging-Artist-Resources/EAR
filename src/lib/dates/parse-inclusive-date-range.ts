/**
 * Inclusive calendar-day range from HTML `type="date"` values (YYYY-MM-DD).
 *
 * Client date inputs are treated as UTC midnight through the end of that UTC day,
 * matching existing admin listing filters.
 */

const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export type InclusiveDateRange = {
  fromISO?: string
  toISO?: string
}

/** True when `value` is a real calendar day in YYYY-MM-DD form. */
export function isDateInputDay(value: string | undefined): value is string {
  if (!value) return false
  const match = DATE_INPUT_PATTERN.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(Date.UTC(year, month - 1, day))

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
}

/**
 * Parse optional From/To date-input values into ISO bounds.
 * Invalid or empty values are ignored. Returns null when neither bound is usable.
 */
export function parseInclusiveDateRange(
  dateFrom?: string,
  dateTo?: string,
): InclusiveDateRange | null {
  const from = isDateInputDay(dateFrom) ? dateFrom : undefined
  const to = isDateInputDay(dateTo) ? dateTo : undefined
  if (!from && !to) return null

  return {
    fromISO: from ? new Date(from).toISOString() : undefined,
    toISO: to
      ? new Date(new Date(to).getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
      : undefined,
  }
}
