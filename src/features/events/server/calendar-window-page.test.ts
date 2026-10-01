import {
  CALENDAR_MAX_PAGES,
  CALENDAR_PAGE_SIZE,
  CalendarWindowTruncatedError,
  readCalendarWindow,
} from "./calendar-window-page"

const FROM = "2026-10-01T04:00:00.000Z"
const TO = "2026-11-01T04:00:00.000Z"

describe("readCalendarWindow", () => {
  it("returns every row across a page boundary, including a short last page", async () => {
    const rows = Array.from({ length: CALENDAR_PAGE_SIZE + 1 }, (_, index) => index)
    const fetchPage = jest.fn(async (offset: number, pageSize: number) =>
      rows.slice(offset, offset + pageSize)
    )

    const result = await readCalendarWindow({ fromISO: FROM, toISO: TO, fetchPage })

    expect(result).toEqual(rows)
    expect(fetchPage).toHaveBeenNthCalledWith(1, 0, CALENDAR_PAGE_SIZE)
    expect(fetchPage).toHaveBeenNthCalledWith(2, CALENDAR_PAGE_SIZE, CALENDAR_PAGE_SIZE)
    expect(new Set(result).size).toBe(result.length)
  })

  it("treats a full page followed by an empty page as complete", async () => {
    const fetchPage = jest.fn(async (offset: number, pageSize: number) =>
      offset === 0 ? Array.from({ length: pageSize }, (_, index) => index) : []
    )

    const result = await readCalendarWindow({ fromISO: FROM, toISO: TO, fetchPage })

    expect(result).toHaveLength(CALENDAR_PAGE_SIZE)
    expect(fetchPage).toHaveBeenCalledTimes(2)
  })

  it("fails instead of returning a partial window when the safety stop is hit", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    const fetchPage = jest.fn(async (_offset: number, pageSize: number) =>
      Array.from({ length: pageSize }, (_, index) => index)
    )

    await expect(
      readCalendarWindow({ fromISO: FROM, toISO: TO, fetchPage })
    ).rejects.toBeInstanceOf(CalendarWindowTruncatedError)

    expect(fetchPage).toHaveBeenCalledTimes(CALENDAR_MAX_PAGES)
    expect(errorSpy).toHaveBeenCalledWith(
      "[calendar] pagination safety stop",
      expect.objectContaining({ from: FROM, to: TO, pageCount: CALENDAR_MAX_PAGES })
    )

    errorSpy.mockRestore()
  })
})
