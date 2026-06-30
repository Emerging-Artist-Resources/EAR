import { Card } from "@/components/ui/card"
import { Text } from "@/components/ui/typography"
import { formatUsdFromCents } from "@/lib/payments/formatUsdFromCents"
import type { ReceivedDonationSummary } from "@/features/profile/server/types"
import { fiscalSponsorshipDashboard } from "@/lib/content/fiscal-sponsorship-dashboard"

const EMPTY_VALUE = "—"
const columns = fiscalSponsorshipDashboard.approved.donationColumns

function formatDonationDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return iso
  }
}

function donorLabel(donation: ReceivedDonationSummary): string {
  return donation.donor_name?.trim() || "Anonymous"
}

function donorEmail(donation: ReceivedDonationSummary): string {
  return donation.donor_email?.trim() || EMPTY_VALUE
}

function DonationSecondaryDetails({ donation }: { donation: ReceivedDonationSummary }) {
  const hasDesignation = Boolean(donation.designation_label_snapshot)
  const hasMessage = Boolean(donation.message)

  if (!hasDesignation && !hasMessage) {
    return null
  }

  return (
    <div className="space-y-1 pt-1">
      {hasDesignation ? (
        <Text className="text-sm text-gray-600">
          Designation: {donation.designation_label_snapshot}
        </Text>
      ) : null}
      {hasMessage ? (
        <Text className="text-sm text-gray-700">&ldquo;{donation.message}&rdquo;</Text>
      ) : null}
    </div>
  )
}

export function ReceivedDonationTableRow({ donation }: { donation: ReceivedDonationSummary }) {
  const hasSecondaryDetails =
    Boolean(donation.designation_label_snapshot) || Boolean(donation.message)

  return (
    <>
      <tr className="border-t border-gray-200">
        <td className="px-3 py-3 align-top">
          <Text className="text-sm font-medium text-gray-900">{donorLabel(donation)}</Text>
        </td>
        <td className="px-3 py-3 align-top">
          <Text className="text-sm text-gray-600">{donorEmail(donation)}</Text>
        </td>
        <td className="px-3 py-3 align-top">
          <Text className="text-sm text-gray-600">{formatDonationDate(donation.created_at)}</Text>
        </td>
        <td className="px-3 py-3 align-top text-right">
          <Text className="text-sm font-semibold text-gray-900">
            {formatUsdFromCents(donation.amount)}
          </Text>
        </td>
      </tr>
      {hasSecondaryDetails ? (
        <tr className="border-t border-gray-100">
          <td colSpan={4} className="px-3 pb-3 pt-0">
            <DonationSecondaryDetails donation={donation} />
          </td>
        </tr>
      ) : null}
    </>
  )
}

function MobileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
      <Text className="text-sm text-gray-600">{label}</Text>
      <Text className="text-sm font-medium text-gray-900 sm:text-right">{value}</Text>
    </div>
  )
}

export function ReceivedDonationMobileCard({ donation }: { donation: ReceivedDonationSummary }) {
  return (
    <Card className="p-4">
      <div className="space-y-2">
        <MobileField label={columns.donor} value={donorLabel(donation)} />
        <MobileField label={columns.email} value={donorEmail(donation)} />
        <MobileField label={columns.date} value={formatDonationDate(donation.created_at)} />
        <MobileField label={columns.amount} value={formatUsdFromCents(donation.amount)} />
        <DonationSecondaryDetails donation={donation} />
      </div>
    </Card>
  )
}
