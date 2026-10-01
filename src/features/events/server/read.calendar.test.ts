const fromMock = jest.fn()

jest.mock("@/lib/supabase/serverAnon", () => ({
  getSupabaseServerClientAnon: () => ({
    from: fromMock,
  }),
}))

import { CalendarWindowTruncatedError } from "./calendar-window-page"
import { listCalendarItemsRepo, listDeadlinesRepo } from "./read"

const FROM = "2026-10-01T04:00:00.000Z"
const TO = "2026-11-01T04:00:00.000Z"

type Capture = {
  gte?: string
  lt?: string
  lte?: string
  orders: string[]
  range?: [number, number]
  limit?: number
}

type Row = {
  id: string
  listing_id: string
  occurrence_type: string
  starts_at_utc: string
  ends_at_utc: null
  tz: string
  listings: {
    id: string
    type: string
    status: string
    class_workshop_details?: { title: string }
    creative_details?: { title: string }
  }
}

let captures: Capture[] = []
let rows: Row[] = []
let alwaysFullPage = false

function classRow(id: string, startsAt: string): Row {
  return {
    id,
    listing_id: `listing-${id}`,
    occurrence_type: "event",
    starts_at_utc: startsAt,
    ends_at_utc: null,
    tz: "America/New_York",
    listings: {
      id: `listing-${id}`,
      type: "class",
      status: "approved",
      class_workshop_details: { title: `Class ${id}` },
    },
  }
}

function deadlineRow(id: string, startsAt: string): Row {
  return {
    id,
    listing_id: `listing-${id}`,
    occurrence_type: "deadline",
    starts_at_utc: startsAt,
    ends_at_utc: null,
    tz: "America/New_York",
    listings: {
      id: `listing-${id}`,
      type: "creative",
      status: "approved",
      creative_details: { title: `Opportunity ${id}` },
    },
  }
}

function queryBuilder() {
  const cap: Capture = { orders: [] }
  captures.push(cap)
  const builder: Record<string, unknown> = {}
  const chain = () => builder
  builder.select = chain
  builder.eq = chain
  builder.is = chain
  builder.or = chain
  builder.in = chain
  builder.gte = (_column: string, value: string) => {
    cap.gte = value
    return builder
  }
  builder.lt = (_column: string, value: string) => {
    cap.lt = value
    return builder
  }
  builder.lte = (_column: string, value: string) => {
    cap.lte = value
    return builder
  }
  builder.limit = (count: number) => {
    cap.limit = count
    return builder
  }
  builder.order = (column: string) => {
    cap.orders.push(column)
    return builder
  }
  builder.range = (start: number, end: number) => {
    cap.range = [start, end]
    return builder
  }
  builder.then = (
    onFulfilled: (value: { data: Row[]; error: null }) => unknown,
    onRejected?: (reason: unknown) => unknown
  ) => {
    let page: Row[]
    if (alwaysFullPage) {
      const size = cap.range ? cap.range[1] - cap.range[0] + 1 : 1000
      page = Array.from({ length: size }, (_, index) =>
        classRow(`full-${cap.range?.[0] ?? 0}-${index}`, "2026-10-15T16:00:00.000Z")
      )
    } else {
      let filtered = rows.filter((row) => {
        if (cap.gte && row.starts_at_utc < cap.gte) return false
        if (cap.lt && row.starts_at_utc >= cap.lt) return false
        if (cap.lte && row.starts_at_utc > cap.lte) return false
        return true
      })
      filtered = [...filtered].sort((a, b) => {
        for (const column of cap.orders) {
          const left = column === "id" ? a.id : a.starts_at_utc
          const right = column === "id" ? b.id : b.starts_at_utc
          const compared = left.localeCompare(right)
          if (compared !== 0) return compared
        }
        return 0
      })
      if (cap.limit != null) filtered = filtered.slice(0, cap.limit)
      else if (cap.range) filtered = filtered.slice(cap.range[0], cap.range[1] + 1)
      page = filtered
    }
    return Promise.resolve({ data: page, error: null }).then(onFulfilled, onRejected)
  }
  return builder
}

describe("listCalendarItemsRepo", () => {
  beforeEach(() => {
    captures = []
    rows = []
    alwaysFullPage = false
    fromMock.mockReset()
    fromMock.mockImplementation(() => queryBuilder())
  })

  it("pages past 1000 rows and still returns an eligible listing from the end of the window", async () => {
    rows = Array.from({ length: 1001 }, (_, index) =>
      classRow(String(index).padStart(4, "0"), new Date(Date.UTC(2026, 9, 1, 12, 0, index)).toISOString())
    )

    const result = await listCalendarItemsRepo({ fromISO: FROM, toISO: TO })

    expect(result).toHaveLength(1001)
    expect(result[0]?.occurrenceId).toBe("0000")
    expect(result[1000]?.occurrenceId).toBe("1000")
    expect(new Set(result.map((item) => item.occurrenceId)).size).toBe(1001)
    expect(captures.map((cap) => cap.range)).toEqual([
      [0, 999],
      [1000, 1999],
    ])
    for (const cap of captures) {
      expect(cap.gte).toBe(FROM)
      expect(cap.lt).toBe(TO)
      expect(cap.lte).toBeUndefined()
      expect(cap.limit).toBeUndefined()
      expect(cap.orders).toEqual(["starts_at_utc", "id"])
    }
  })

  it("returns same-start occurrences in id order", async () => {
    const startsAt = "2026-10-11T20:00:00.000Z"
    rows = [classRow("b", startsAt), classRow("a", startsAt)]

    const result = await listCalendarItemsRepo({ fromISO: FROM, toISO: TO })

    expect(result.map((item) => item.occurrenceId)).toEqual(["a", "b"])
    expect(captures[0]?.orders).toEqual(["starts_at_utc", "id"])
  })

  it("includes the window start and excludes the exclusive end", async () => {
    rows = [
      classRow("start", FROM),
      classRow("end", TO),
      classRow("inside", "2026-10-31T03:59:00.000Z"),
    ]

    const result = await listCalendarItemsRepo({ fromISO: FROM, toISO: TO })

    expect(result.map((item) => item.occurrenceId).sort()).toEqual(["inside", "start"])
  })

  it("fails the request when pagination hits the safety stop", async () => {
    alwaysFullPage = true
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})

    await expect(listCalendarItemsRepo({ fromISO: FROM, toISO: TO })).rejects.toBeInstanceOf(
      CalendarWindowTruncatedError
    )

    expect(captures).toHaveLength(10)
    expect(errorSpy).toHaveBeenCalledWith(
      "[calendar] pagination safety stop",
      expect.objectContaining({ from: FROM, to: TO, pageCount: 10 })
    )

    errorSpy.mockRestore()
  })
})

describe("listDeadlinesRepo", () => {
  beforeEach(() => {
    captures = []
    rows = []
    alwaysFullPage = false
    fromMock.mockReset()
    fromMock.mockImplementation(() => queryBuilder())
  })

  it("returns deadlines past the old 100-row cap, through the end of the window", async () => {
    rows = Array.from({ length: 1001 }, (_, index) =>
      deadlineRow(String(index).padStart(4, "0"), new Date(Date.UTC(2026, 9, 2, 12, 0, index)).toISOString())
    )

    const result = await listDeadlinesRepo({ fromISO: FROM, toISO: TO })

    expect(result).toHaveLength(1001)
    expect(result[1000]?.occurrenceId).toBe("1000")
    expect(captures.map((cap) => cap.range)).toEqual([
      [0, 999],
      [1000, 1999],
    ])
    for (const cap of captures) {
      expect(cap.limit).toBeUndefined()
      expect(cap.lt).toBe(TO)
      expect(cap.orders).toEqual(["starts_at_utc", "id"])
    }
  })
})
