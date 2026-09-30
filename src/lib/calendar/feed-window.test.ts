import {
  deadlineWindow,
  dedupeCalendarItems,
  instantInWindow,
  monthKeysOverlapping,
  monthWindow,
  neighborMonthKeys,
  nyDateKey,
} from "./feed-window"

describe("monthWindow", () => {
  it("uses a half-open bound so adjacent months meet and do not overlap", () => {
    const october = monthWindow("2026-10")
    const november = monthWindow("2026-11")

    expect(october.to).toBe(november.from)
    expect(october.from < october.to).toBe(true)

    const boundary = november.from
    expect(instantInWindow(boundary, november)).toBe(true)
    expect(instantInWindow(boundary, october)).toBe(false)
    expect(nyDateKey(new Date(boundary))).toBe("2026-11-01")
  })
})

describe("monthKeysOverlapping", () => {
  it("includes both months when a week crosses the boundary", () => {
    expect(
      monthKeysOverlapping({
        start: new Date(2026, 8, 27),
        end: new Date(2026, 9, 3),
      })
    ).toEqual(["2026-09", "2026-10"])
  })
})

describe("neighborMonthKeys", () => {
  it("prefetches the months just outside the visible ones", () => {
    expect(neighborMonthKeys(["2026-10"])).toEqual(["2026-09", "2026-11"])
    expect(neighborMonthKeys(["2026-09", "2026-10"])).toEqual(["2026-08", "2026-11"])
  })
})

describe("deadlineWindow", () => {
  it("runs from the start of today in New York through three months ahead", () => {
    const now = new Date("2026-09-30T15:00:00.000Z")
    const window = deadlineWindow(now)

    expect(nyDateKey(new Date(window.from))).toBe("2026-09-30")
    expect(nyDateKey(new Date(window.to))).toBe("2026-12-30")
    expect(instantInWindow(window.from, window)).toBe(true)
    expect(instantInWindow(window.to, window)).toBe(false)
  })

  it("does not follow the month on screen", () => {
    const now = new Date("2026-09-30T15:00:00.000Z")
    expect(deadlineWindow(now)).toEqual(deadlineWindow(now))
    expect(deadlineWindow(now).from).not.toBe(monthWindow("2026-11").from)
  })
})

describe("dedupeCalendarItems", () => {
  it("keeps the first item for each occurrence id", () => {
    const first = { occurrenceId: "occ-1", title: "first" }
    const duplicate = { occurrenceId: "occ-1", title: "second" }
    const other = { occurrenceId: "occ-2", title: "other" }

    expect(dedupeCalendarItems([first, duplicate, other])).toEqual([first, other])
  })
})
