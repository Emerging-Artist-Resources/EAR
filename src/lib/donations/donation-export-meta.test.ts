import {
  buildDonationExportMeta,
  donationExportMetaHeaders,
  DONATION_EXPORT_HEADERS,
  isDonationExportTruncated,
  readDonationExportMeta,
} from "./donation-export-meta"

describe("isDonationExportTruncated", () => {
  const maxRows = 2000

  it("is false when total equals the row cap", () => {
    expect(isDonationExportTruncated(maxRows, maxRows)).toBe(false)
  })

  it("is true when total exceeds the row cap", () => {
    expect(isDonationExportTruncated(maxRows + 1, maxRows)).toBe(true)
  })

  it("is false when total is below the row cap", () => {
    expect(isDonationExportTruncated(0, maxRows)).toBe(false)
    expect(isDonationExportTruncated(maxRows - 1, maxRows)).toBe(false)
  })
})

describe("donation export meta headers", () => {
  it("round-trips truncated and count headers", () => {
    const meta = buildDonationExportMeta({
      rowCount: 2000,
      totalCount: 14382,
      maxRows: 2000,
    })
    expect(meta).toEqual({
      truncated: true,
      rowCount: 2000,
      totalCount: 14382,
    })

    const headers = new Headers(donationExportMetaHeaders(meta))
    expect(headers.get(DONATION_EXPORT_HEADERS.truncated)).toBe("true")
    expect(headers.get(DONATION_EXPORT_HEADERS.rowCount)).toBe("2000")
    expect(headers.get(DONATION_EXPORT_HEADERS.totalCount)).toBe("14382")
    expect(readDonationExportMeta(headers)).toEqual(meta)
  })

  it("marks non-truncated exports explicitly false", () => {
    const meta = buildDonationExportMeta({
      rowCount: 50,
      totalCount: 50,
      maxRows: 2000,
    })
    expect(meta.truncated).toBe(false)
    expect(donationExportMetaHeaders(meta)[DONATION_EXPORT_HEADERS.truncated]).toBe("false")
  })
})
