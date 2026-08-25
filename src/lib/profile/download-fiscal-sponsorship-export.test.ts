/**
 * @jest-environment jsdom
 */

import {
  downloadFiscalSponsorshipExport,
  formatDonationExportTruncatedToast,
} from "./download-fiscal-sponsorship-export"
import { DONATION_EXPORT_HEADERS } from "@/lib/donations/donation-export-meta"

function mockResponse(init: {
  ok: boolean
  status?: number
  headers?: Record<string, string>
  json?: unknown
  blob?: Blob
}): Response {
  const headers = new Headers(init.headers)
  return {
    ok: init.ok,
    status: init.status ?? (init.ok ? 200 : 500),
    headers,
    json: async () => init.json,
    blob: async () => {
      if (!init.ok) {
        throw new Error("blob() must not be called for non-2xx responses")
      }
      return init.blob ?? new Blob(["xlsx"])
    },
  } as Response
}

describe("formatDonationExportTruncatedToast", () => {
  it("fills row and total counts into the content template", () => {
    expect(
      formatDonationExportTruncatedToast({
        truncated: true,
        rowCount: 2000,
        totalCount: 14382,
      }),
    ).toBe("Exported the first 2000 of 14382 donations")
  })
})

describe("downloadFiscalSponsorshipExport", () => {
  const originalCreateObjectURL = URL.createObjectURL
  const originalRevokeObjectURL = URL.revokeObjectURL
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    jest.restoreAllMocks()
    URL.createObjectURL = jest.fn(() => "blob:mock")
    URL.revokeObjectURL = jest.fn()
  })

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
    globalThis.fetch = originalFetch
  })

  it("rejects non-2xx responses before reading the body as a blob", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      mockResponse({
        ok: false,
        status: 500,
        json: { error: { message: "Export failed" } },
      }),
    )
    globalThis.fetch = fetchMock as typeof fetch

    await expect(downloadFiscalSponsorshipExport({})).rejects.toThrow("Export failed")
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/profile/fiscal-sponsorship/export",
      expect.objectContaining({ method: "GET" }),
    )
  })

  it("downloads the blob and returns truncation metadata on success", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      mockResponse({
        ok: true,
        headers: {
          [DONATION_EXPORT_HEADERS.truncated]: "true",
          [DONATION_EXPORT_HEADERS.rowCount]: "2000",
          [DONATION_EXPORT_HEADERS.totalCount]: "2500",
        },
        blob: new Blob(["xlsx-bytes"]),
      }),
    ) as typeof fetch

    const click = jest.fn()
    const anchor = {
      href: "",
      download: "",
      rel: "",
      click,
    }
    jest.spyOn(document, "createElement").mockReturnValue(anchor as unknown as HTMLAnchorElement)
    jest.spyOn(document.body, "appendChild").mockImplementation((node) => node)
    jest.spyOn(document.body, "removeChild").mockImplementation((node) => node)

    await expect(
      downloadFiscalSponsorshipExport({ dateFrom: "2026-08-01", dateTo: "2026-08-18" }),
    ).resolves.toEqual({
      truncated: true,
      rowCount: 2000,
      totalCount: 2500,
    })
    expect(click).toHaveBeenCalled()
    expect(anchor.download).toBe("donations-2026-08-01-to-2026-08-18.xlsx")
  })
})
