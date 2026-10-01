export const CALENDAR_PAGE_SIZE = 1000
export const CALENDAR_MAX_PAGES = 10

/**
 * The date window was not fully read. Callers must not turn this into a
 * successful partial list.
 */
export class CalendarWindowTruncatedError extends Error {
  readonly fromISO: string
  readonly toISO: string
  readonly pageCount: number

  constructor(fromISO: string, toISO: string, pageCount: number) {
    super(`Calendar window ${fromISO} .. ${toISO} exceeded ${pageCount} pages`)
    this.name = "CalendarWindowTruncatedError"
    this.fromISO = fromISO
    this.toISO = toISO
    this.pageCount = pageCount
  }
}

/**
 * Read every row in a half-open window. A full final page is an error: the
 * result would be a successful but incomplete set.
 */
export async function readCalendarWindow<T>(params: {
  fromISO: string
  toISO: string
  pageSize?: number
  maxPages?: number
  fetchPage: (offset: number, pageSize: number) => Promise<T[]>
}): Promise<T[]> {
  const pageSize = params.pageSize ?? CALENDAR_PAGE_SIZE
  const maxPages = params.maxPages ?? CALENDAR_MAX_PAGES
  const rows: T[] = []

  for (let page = 0; page < maxPages; page++) {
    const batch = await params.fetchPage(page * pageSize, pageSize)
    rows.push(...batch)
    if (batch.length < pageSize) return rows
  }

  console.error("[calendar] pagination safety stop", {
    from: params.fromISO,
    to: params.toISO,
    pageCount: maxPages,
  })
  throw new CalendarWindowTruncatedError(params.fromISO, params.toISO, maxPages)
}
