const DASHBOARD_PATH = "/api/profile/fiscal-sponsorship"
const EXPORT_PATH = "/api/profile/fiscal-sponsorship/export"

export function buildFiscalSponsorshipSearchParams(options: {
  page?: number
  dateFrom?: string
  dateTo?: string
}): URLSearchParams {
  const params = new URLSearchParams()
  if (options.page != null) params.set("page", String(options.page))
  if (options.dateFrom) params.set("dateFrom", options.dateFrom)
  if (options.dateTo) params.set("dateTo", options.dateTo)
  return params
}

export function fiscalSponsorshipDashboardPath(options: {
  page: number
  dateFrom?: string
  dateTo?: string
}): string {
  const query = buildFiscalSponsorshipSearchParams(options).toString()
  return `${DASHBOARD_PATH}?${query}`
}

export function fiscalSponsorshipExportPath(options: {
  dateFrom?: string
  dateTo?: string
}): string {
  const query = buildFiscalSponsorshipSearchParams({
    dateFrom: options.dateFrom,
    dateTo: options.dateTo,
  }).toString()
  return query ? `${EXPORT_PATH}?${query}` : EXPORT_PATH
}

export function fiscalSponsorshipReceiptPath(donationId: string): string {
  return `${DASHBOARD_PATH}/donations/${encodeURIComponent(donationId)}/receipt`
}
