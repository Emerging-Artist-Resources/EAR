import {
  parseInclusiveDateRange,
  type InclusiveDateRange,
} from "@/lib/dates/parse-inclusive-date-range"

export type AdminListingDateBasis = "submitted" | "event" | "deadline"

export function parseAdminListingDateBasis(
  value: string | undefined,
): AdminListingDateBasis {
  if (value === "event" || value === "deadline") return value
  return "submitted"
}

export type AdminListingDateRange = InclusiveDateRange

/** Matches client date-input semantics: YYYY-MM-DD is UTC midnight through end of day. */
export function parseAdminListingDateRange(
  dateFrom?: string,
  dateTo?: string,
): AdminListingDateRange | null {
  return parseInclusiveDateRange(dateFrom, dateTo)
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
