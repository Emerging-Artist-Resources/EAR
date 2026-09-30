import { renderHook, act } from "@testing-library/react"
import { apiGet } from "@/lib/client/fetch-utils"
import { monthWindow } from "@/lib/calendar/feed-window"
import { useCalendar, type CalendarItem } from "./use-calendar"

jest.mock("@/lib/client/fetch-utils", () => ({
  apiGet: jest.fn(),
}))

const apiGetMock = apiGet as jest.Mock

function item(occurrenceId: string, start = "2026-10-11T20:00:00.000Z"): CalendarItem {
  return {
    occurrenceId,
    listingId: `listing-${occurrenceId}`,
    type: "class",
    title: occurrenceId,
    start,
    tz: "America/New_York",
  }
}

function requestUrl(call: unknown[]): URL {
  return new URL(String(call[0]), "http://localhost")
}

function isMonthRequest(call: unknown[], monthKey: string): boolean {
  const url = requestUrl(call)
  return url.searchParams.get("feed") !== "deadlines" && url.searchParams.get("from") === monthWindow(monthKey).from
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const octoberRange = { start: new Date(2026, 9, 15), end: new Date(2026, 9, 20) }
const novemberRange = { start: new Date(2026, 10, 4), end: new Date(2026, 10, 10) }

describe("useCalendar", () => {
  beforeEach(() => {
    apiGetMock.mockReset()
  })

  it("ignores a superseded in-flight response for the same month", async () => {
    const first = deferred<{ data: CalendarItem[]; deadlines: CalendarItem[] }>()
    const second = deferred<{ data: CalendarItem[]; deadlines: CalendarItem[] }>()
    let octoberCalls = 0

    apiGetMock.mockImplementation((url: string) => {
      const parsed = new URL(url, "http://localhost")
      if (parsed.searchParams.get("from") === monthWindow("2026-10").from) {
        octoberCalls += 1
        return octoberCalls === 1 ? first.promise : second.promise
      }
      return Promise.resolve({ data: [], deadlines: [] })
    })

    const { result } = renderHook(() => useCalendar())

    await act(async () => {
      const initial = result.current.ensureVisibleRange(octoberRange)
      const refresh = result.current.refreshVisible({ bypassCache: true })
      second.resolve({ data: [item("newer")], deadlines: [] })
      first.resolve({ data: [item("older")], deadlines: [] })
      await Promise.all([initial, refresh])
    })

    expect(result.current.items.map((entry) => entry.occurrenceId)).toEqual(["newer"])
  })

  it("does not fetch a month again after it is cached", async () => {
    apiGetMock.mockImplementation((url: string) => {
      const parsed = new URL(url, "http://localhost")
      if (parsed.searchParams.get("from") === monthWindow("2026-10").from) {
        return Promise.resolve({ data: [item("cached")], deadlines: [] })
      }
      return Promise.resolve({ data: [], deadlines: [] })
    })

    const { result } = renderHook(() => useCalendar())

    await act(async () => {
      await result.current.ensureVisibleRange(octoberRange)
    })
    const callsAfterLoad = apiGetMock.mock.calls.length

    await act(async () => {
      await result.current.ensureVisibleRange(octoberRange)
    })

    expect(apiGetMock.mock.calls.length).toBe(callsAfterLoad)
    expect(result.current.items.map((entry) => entry.occurrenceId)).toEqual(["cached"])
  })

  it("keeps cached items mounted when a later refresh of that month fails", async () => {
    apiGetMock.mockResolvedValue({ data: [item("kept")], deadlines: [] })

    const { result } = renderHook(() => useCalendar())

    await act(async () => {
      await result.current.ensureVisibleRange(octoberRange)
    })

    apiGetMock.mockImplementation((url: string) => {
      const parsed = new URL(url, "http://localhost")
      if (parsed.searchParams.get("from") === monthWindow("2026-10").from) {
        return Promise.reject(new Error("nope"))
      }
      return Promise.resolve({ data: [], deadlines: [] })
    })

    await act(async () => {
      await result.current.refreshVisible({ bypassCache: true })
    })

    expect(result.current.items.map((entry) => entry.occurrenceId)).toEqual(["kept"])
    expect(result.current.error).toBe("nope")
    expect(result.current.isInitialLoading).toBe(false)
  })

  it("dedupes an occurrence returned by two overlapping months", async () => {
    const shared = item("shared", "2026-10-01T04:00:00.000Z")
    apiGetMock.mockImplementation((url: string) => {
      const parsed = new URL(url, "http://localhost")
      const from = parsed.searchParams.get("from")
      if (from === monthWindow("2026-09").from || from === monthWindow("2026-10").from) {
        return Promise.resolve({ data: [shared], deadlines: [] })
      }
      return Promise.resolve({ data: [], deadlines: [] })
    })

    const { result } = renderHook(() => useCalendar())

    await act(async () => {
      await result.current.ensureVisibleRange({
        start: new Date(2026, 8, 27),
        end: new Date(2026, 9, 3),
      })
    })

    expect(result.current.items).toEqual([shared])
  })

  it("loads deadlines on a fixed upcoming window and does not refetch them when the month changes", async () => {
    const now = new Date("2026-09-30T15:00:00.000Z")
    apiGetMock.mockResolvedValue({ data: [], deadlines: [item("deadline")] })

    const { result } = renderHook(() => useCalendar())

    await act(async () => {
      await result.current.loadDeadlines({ now })
      await result.current.ensureVisibleRange(octoberRange)
      await result.current.ensureVisibleRange(novemberRange)
    })

    const deadlineCalls = apiGetMock.mock.calls.filter(
      (call) => requestUrl(call).searchParams.get("feed") === "deadlines"
    )
    expect(deadlineCalls).toHaveLength(1)

    const deadlineUrl = requestUrl(deadlineCalls[0])
    expect(deadlineUrl.searchParams.get("from")).not.toBe(monthWindow("2026-10").from)
    expect(deadlineUrl.searchParams.get("from")).not.toBe(monthWindow("2026-11").from)
    expect(deadlineUrl.searchParams.get("to")).not.toBe(monthWindow("2026-10").to)

    const monthCalls = apiGetMock.mock.calls.filter(
      (call) => isMonthRequest(call, "2026-10") || isMonthRequest(call, "2026-11")
    )
    expect(monthCalls.length).toBeGreaterThan(0)
    for (const call of monthCalls) {
      expect(requestUrl(call).searchParams.get("feed")).toBeNull()
    }
  })
})
