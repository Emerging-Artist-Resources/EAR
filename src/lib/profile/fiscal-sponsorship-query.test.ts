import {
  buildFiscalSponsorshipSearchParams,
  fiscalSponsorshipDashboardPath,
  fiscalSponsorshipExportPath,
  fiscalSponsorshipReceiptPath,
} from "./fiscal-sponsorship-query"

describe("buildFiscalSponsorshipSearchParams", () => {
  it("includes page and date bounds when present", () => {
    const params = buildFiscalSponsorshipSearchParams({
      page: 2,
      dateFrom: "2026-08-01",
      dateTo: "2026-08-18",
    })
    expect(params.get("page")).toBe("2")
    expect(params.get("dateFrom")).toBe("2026-08-01")
    expect(params.get("dateTo")).toBe("2026-08-18")
  })

  it("omits empty date bounds", () => {
    const params = buildFiscalSponsorshipSearchParams({ page: 0 })
    expect(params.get("page")).toBe("0")
    expect(params.get("dateFrom")).toBeNull()
    expect(params.get("dateTo")).toBeNull()
  })
})

describe("fiscal sponsorship paths", () => {
  it("builds the dashboard list URL with the current page", () => {
    expect(
      fiscalSponsorshipDashboardPath({ page: 1, dateFrom: "2026-08-01" }),
    ).toBe("/api/profile/fiscal-sponsorship?page=1&dateFrom=2026-08-01")
  })

  it("builds the export URL without a page param", () => {
    expect(fiscalSponsorshipExportPath({})).toBe("/api/profile/fiscal-sponsorship/export")
    expect(fiscalSponsorshipExportPath({ dateFrom: "2026-08-01", dateTo: "2026-08-18" })).toBe(
      "/api/profile/fiscal-sponsorship/export?dateFrom=2026-08-01&dateTo=2026-08-18",
    )
  })

  it("builds a per-donation receipt URL", () => {
    expect(fiscalSponsorshipReceiptPath("donation-1")).toBe(
      "/api/profile/fiscal-sponsorship/donations/donation-1/receipt",
    )
  })
})
