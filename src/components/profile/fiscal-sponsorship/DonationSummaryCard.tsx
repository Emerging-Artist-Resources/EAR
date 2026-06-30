import { Card } from "@/components/ui/card"
import { H3, Text } from "@/components/ui/typography"
import { formatUsdFromCents } from "@/lib/payments/formatUsdFromCents"
import type { DonationSummaryStats } from "@/features/profile/server/types"
import { fiscalSponsorshipDashboard } from "@/lib/content/fiscal-sponsorship-dashboard"

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <Text className="text-sm text-gray-600">{label}</Text>
      <Text className="text-lg font-semibold text-gray-900">{value}</Text>
    </div>
  )
}

export function DonationSummaryCard({ summary }: { summary: DonationSummaryStats }) {
  const copy = fiscalSponsorshipDashboard.donationSummary

  return (
    <Card className="p-4">
      <H3 className="mb-4 text-lg font-semibold text-gray-900">{copy.heading}</H3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryStat
          label={copy.totalLabel}
          value={formatUsdFromCents(summary.total_amount_cents)}
        />
        <SummaryStat
          label={copy.countLabel}
          value={String(summary.donation_count)}
        />
        <SummaryStat
          label={copy.averageLabel}
          value={formatUsdFromCents(summary.average_amount_cents)}
        />
      </div>
    </Card>
  )
}
