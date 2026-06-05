export type AdminListingDateBasis = "submitted" | "event" | "deadline"

export function parseAdminListingDateBasis(
  value: string | undefined,
): AdminListingDateBasis {
  if (value === "event" || value === "deadline") return value
  return "submitted"
}

export type AdminListingDateRange = {
  fromISO?: string
  toISO?: string
}

/** Matches client date-input semantics: YYYY-MM-DD is UTC midnight through end of day. */
export function parseAdminListingDateRange(
  dateFrom?: string,
  dateTo?: string,
): AdminListingDateRange | null {
  if (!dateFrom && !dateTo) return null

  const fromISO = dateFrom ? new Date(dateFrom).toISOString() : undefined
  const toISO = dateTo
    ? new Date(new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
    : undefined

  return { fromISO, toISO }
}

export function adminListingDateColumnLabel(
  dateBasis: AdminListingDateBasis,
): string {
  switch (dateBasis) {
    case "event":
      return "Event date"
    case "deadline":
      return "Deadline"
    default:
      return "Submitted"
  }
}
