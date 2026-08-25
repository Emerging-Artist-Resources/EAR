import type { ReceivedDonationSummary } from "@/features/profile/server/types"
import { isDateInputDay } from "@/lib/dates/parse-inclusive-date-range"
import { donorDisplayName } from "@/lib/donations/donor-display"
import { centsToUsdAmount } from "@/lib/payments/formatUsdFromCents"

export type DonationExportRow = {
  donor: string
  email: string
  date: Date
  amount: number
  stripeFee: number
  fiscalFee: number
  net: number
  designation: string
  message: string
}

export function toDonationExportRow(donation: ReceivedDonationSummary): DonationExportRow {
  return {
    donor: donorDisplayName(donation.donor_name),
    email: donation.donor_email?.trim() || "",
    date: new Date(donation.created_at),
    amount: centsToUsdAmount(donation.amount),
    stripeFee: centsToUsdAmount(donation.stripe_fee_cents),
    fiscalFee: centsToUsdAmount(donation.fiscal_fee_cents),
    net: centsToUsdAmount(donation.net_cents),
    designation: donation.designation_label_snapshot?.trim() || "",
    message: donation.message?.trim() || "",
  }
}

function dateLessExportFileName(): string {
  const today = new Date().toISOString().slice(0, 10)
  return `donations-${today}.xlsx`
}

/**
 * Build a Content-Disposition filename from optional date filters.
 * Only embed calendar days that pass `isDateInputDay`. If either provided bound
 * is non-empty but invalid, use the date-less fallback (never partially embed).
 */
export function buildDonationExportFileName(dateFrom?: string, dateTo?: string): string {
  const fromRaw = dateFrom?.trim() || ""
  const toRaw = dateTo?.trim() || ""
  const fromProvided = fromRaw.length > 0
  const toProvided = toRaw.length > 0
  const fromValid = isDateInputDay(fromRaw)
  const toValid = isDateInputDay(toRaw)

  if ((fromProvided && !fromValid) || (toProvided && !toValid)) {
    return dateLessExportFileName()
  }

  if (fromValid && toValid) return `donations-${fromRaw}-to-${toRaw}.xlsx`
  if (fromValid) return `donations-from-${fromRaw}.xlsx`
  if (toValid) return `donations-through-${toRaw}.xlsx`
  return dateLessExportFileName()
}
