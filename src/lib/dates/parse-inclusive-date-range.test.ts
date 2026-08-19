import {
  isDateInputDay,
  parseInclusiveDateRange,
} from "./parse-inclusive-date-range"

describe("isDateInputDay", () => {
  it("accepts a real YYYY-MM-DD calendar day", () => {
    expect(isDateInputDay("2026-08-18")).toBe(true)
  })

  it("rejects empty, malformed, and impossible days", () => {
    expect(isDateInputDay(undefined)).toBe(false)
    expect(isDateInputDay("")).toBe(false)
    expect(isDateInputDay("08/18/2026")).toBe(false)
    expect(isDateInputDay("2026-13-01")).toBe(false)
    expect(isDateInputDay("2026-02-30")).toBe(false)
  })
})

describe("parseInclusiveDateRange", () => {
  it("returns null when neither bound is a usable date", () => {
    expect(parseInclusiveDateRange()).toBeNull()
    expect(parseInclusiveDateRange("", "")).toBeNull()
    expect(parseInclusiveDateRange("nope", "2026-02-30")).toBeNull()
  })

  it("parses a from-only range as UTC midnight", () => {
    expect(parseInclusiveDateRange("2026-08-18")).toEqual({
      fromISO: "2026-08-18T00:00:00.000Z",
      toISO: undefined,
    })
  })

  it("parses a to-only range as the end of that UTC day", () => {
    expect(parseInclusiveDateRange(undefined, "2026-08-18")).toEqual({
      fromISO: undefined,
      toISO: "2026-08-18T23:59:59.999Z",
    })
  })

  it("parses an inclusive from/to range", () => {
    expect(parseInclusiveDateRange("2026-08-01", "2026-08-18")).toEqual({
      fromISO: "2026-08-01T00:00:00.000Z",
      toISO: "2026-08-18T23:59:59.999Z",
    })
  })

  it("ignores an invalid bound and keeps the valid one", () => {
    expect(parseInclusiveDateRange("2026-08-18", "not-a-date")).toEqual({
      fromISO: "2026-08-18T00:00:00.000Z",
      toISO: undefined,
    })
  })
})
