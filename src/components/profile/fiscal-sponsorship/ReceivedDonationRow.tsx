import { Card } from "@/components/ui/card"
import { Text } from "@/components/ui/typography"
import { formatUsdFromCents } from "@/lib/payments/formatUsdFromCents"
import type { ReceivedDonationSummary } from "@/features/profile/server/types"

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

export function ReceivedDonationRow({ donation }: { donation: ReceivedDonationSummary }) {
  const donorLabel = donation.donor_name?.trim() || "Anonymous"

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="font-medium text-gray-900">{donorLabel}</div>
          <Text className="text-sm text-gray-600">{formatDonationDate(donation.created_at)}</Text>
          {donation.designation_label_snapshot ? (
            <Text className="text-sm text-gray-600">
              Designation: {donation.designation_label_snapshot}
            </Text>
          ) : null}
          {donation.message ? (
            <Text className="text-sm text-gray-700">&ldquo;{donation.message}&rdquo;</Text>
          ) : null}
        </div>
        <div className="font-semibold text-gray-900 sm:text-right">
          {formatUsdFromCents(donation.base_gift_cents)}
        </div>
      </div>
    </Card>
  )
}
