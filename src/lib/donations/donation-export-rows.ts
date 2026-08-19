import type { ReceivedDonationSummary } from "@/features/profile/server/types"
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

export function buildDonationExportFileName(dateFrom?: string, dateTo?: string): string {
  if (dateFrom && dateTo) return `donations-${dateFrom}-to-${dateTo}.xlsx`
  if (dateFrom) return `donations-from-${dateFrom}.xlsx`
  if (dateTo) return `donations-through-${dateTo}.xlsx`
  const today = new Date().toISOString().slice(0, 10)
  return `donations-${today}.xlsx`
}
