import { Card } from "@/components/ui/card"
import { Text } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { formatUsdFromCents } from "@/lib/payments/formatUsdFromCents"
import { donorDisplayName } from "@/lib/donations/donor-display"
import {
  formatDonorCellDesignationLine,
  formatDonorCellMessageLine,
  RECEIVED_DONATION_DONOR_COLUMN_CLASS,
} from "@/lib/donations/received-donation-donor-display"
import type { ReceivedDonationSummary } from "@/features/profile/server/types"
import { fiscalSponsorshipDashboard } from "@/lib/content/fiscal-sponsorship-dashboard"
import { fiscalSponsorshipReceiptPath } from "@/lib/profile/fiscal-sponsorship-query"

const EMPTY_VALUE = "—"
const columns = fiscalSponsorshipDashboard.approved.donationColumns
const donorContextCopy = fiscalSponsorshipDashboard.approved.donationDonorContext

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
  return donorDisplayName(donation.donor_name)
}

function donorEmail(donation: ReceivedDonationSummary): string {
  return donation.donor_email?.trim() || EMPTY_VALUE
}

/** Name + optional designation / message — compact identity cell for table and mobile. */
function DonorIdentityCell({
  donation,
  layout,
}: {
  donation: ReceivedDonationSummary
  layout: "table" | "mobile"
}) {
  const designationRaw = donation.designation_label_snapshot?.trim()
  const messageRaw = donation.message?.trim()
  const designation = designationRaw
    ? formatDonorCellDesignationLine(designationRaw, donorContextCopy.designationPrefix)
    : null
  const message = messageRaw ? formatDonorCellMessageLine(messageRaw) : null

  const containerClass =
    layout === "table"
      ? "min-w-0 w-full"
      : "min-w-0 w-full max-w-full sm:max-w-[70%] sm:text-right"

  return (
    <div className={containerClass}>
      <Text className="text-sm font-medium text-gray-900">{donorLabel(donation)}</Text>
      {designation ? (
        <p
          className="mt-0.5 truncate text-xs text-gray-500"
          title={designation.title}
        >
          {designation.display}
        </p>
      ) : null}
      {message ? (
        <p
          className="mt-0.5 truncate text-xs italic text-gray-500"
          title={message.title ?? message.full}
        >
          {message.display}
        </p>
      ) : null}
    </div>
  )
}

function ReceiptLink({ donationId }: { donationId: string }) {
  return (
    <Button asChild variant="link" size="sm" className="h-auto px-0">
      <a href={fiscalSponsorshipReceiptPath(donationId)}>{columns.receipt}</a>
    </Button>
  )
}

function MoneyCell({
  cents,
  emphasized = false,
}: {
  cents: number
  emphasized?: boolean
}) {
  return (
    <td className="px-3 py-3 align-top text-right">
      <Text
        className={
          emphasized ? "text-sm font-semibold text-gray-900" : "text-sm text-gray-600"
        }
      >
        {formatUsdFromCents(cents)}
      </Text>
    </td>
  )
}

export const receivedDonationDonorColumnClass = RECEIVED_DONATION_DONOR_COLUMN_CLASS

export function ReceivedDonationTableRow({ donation }: { donation: ReceivedDonationSummary }) {
  return (
    <tr className="border-t border-gray-200">
      <td className={`px-3 py-3 align-top ${RECEIVED_DONATION_DONOR_COLUMN_CLASS}`}>
        <DonorIdentityCell donation={donation} layout="table" />
      </td>
      <td className="px-3 py-3 align-top">
        <Text className="text-sm text-gray-600">{donorEmail(donation)}</Text>
      </td>
      <td className="px-3 py-3 align-top">
        <Text className="text-sm text-gray-600">{formatDonationDate(donation.created_at)}</Text>
      </td>
      <MoneyCell cents={donation.amount} emphasized />
      <MoneyCell cents={donation.stripe_fee_cents} />
      <MoneyCell cents={donation.fiscal_fee_cents} />
      <MoneyCell cents={donation.net_cents} emphasized />
      <td className="px-3 py-3 align-top">
        <ReceiptLink donationId={donation.id} />
      </td>
    </tr>
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
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <Text className="text-sm text-gray-600">{columns.donor}</Text>
          <DonorIdentityCell donation={donation} layout="mobile" />
        </div>
        <MobileField label={columns.email} value={donorEmail(donation)} />
        <MobileField label={columns.date} value={formatDonationDate(donation.created_at)} />
        <MobileField label={columns.amount} value={formatUsdFromCents(donation.amount)} />
        <MobileField label={columns.stripeFee} value={formatUsdFromCents(donation.stripe_fee_cents)} />
        <MobileField label={columns.fiscalFee} value={formatUsdFromCents(donation.fiscal_fee_cents)} />
        <MobileField label={columns.net} value={formatUsdFromCents(donation.net_cents)} />
        <ReceiptLink donationId={donation.id} />
      </div>
    </Card>
  )
}
