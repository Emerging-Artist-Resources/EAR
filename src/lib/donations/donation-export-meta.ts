/**
 * Shared metadata for fiscal-sponsorship donation Excel exports.
 * File body stays a normal download; truncation/counts travel in response headers.
 */

export const DONATION_EXPORT_HEADERS = {
  truncated: "X-EAR-Export-Truncated",
  rowCount: "X-EAR-Export-Row-Count",
  totalCount: "X-EAR-Export-Total-Count",
} as const

export type DonationExportMeta = {
  truncated: boolean
  rowCount: number
  totalCount: number
}

/** True when the matching set is larger than the export row cap. Exactly `maxRows` is not truncated. */
export function isDonationExportTruncated(totalCount: number, maxRows: number): boolean {
  return totalCount > maxRows
}

export function buildDonationExportMeta(params: {
  rowCount: number
  totalCount: number
  maxRows: number
}): DonationExportMeta {
  const { rowCount, totalCount, maxRows } = params
  return {
    truncated: isDonationExportTruncated(totalCount, maxRows),
    rowCount,
    totalCount,
  }
}

export function donationExportMetaHeaders(meta: DonationExportMeta): Record<string, string> {
  return {
    [DONATION_EXPORT_HEADERS.truncated]: meta.truncated ? "true" : "false",
    [DONATION_EXPORT_HEADERS.rowCount]: String(meta.rowCount),
    [DONATION_EXPORT_HEADERS.totalCount]: String(meta.totalCount),
  }
}

function readNonNegativeIntHeader(headers: Headers, name: string): number {
  const raw = headers.get(name)
  if (raw == null || raw === "") return 0
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.floor(value)
}

export function readDonationExportMeta(headers: Headers): DonationExportMeta {
  return {
    truncated: headers.get(DONATION_EXPORT_HEADERS.truncated) === "true",
    rowCount: readNonNegativeIntHeader(headers, DONATION_EXPORT_HEADERS.rowCount),
    totalCount: readNonNegativeIntHeader(headers, DONATION_EXPORT_HEADERS.totalCount),
  }
}
