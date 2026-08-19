import { H3, Text } from "@/components/ui/typography"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminPagination } from "@/components/admin/AdminPagination"
import {
  ReceivedDonationMobileCard,
  ReceivedDonationTableRow,
} from "./ReceivedDonationRow"
import { DonationDateFilter, type DonationDateRange } from "./DonationDateFilter"
import type { ReceivedDonationSummary } from "@/features/profile/server/types"
import {
  fiscalSponsorshipDashboard,
  fiscalDashboardButtonClass,
} from "@/lib/content/fiscal-sponsorship-dashboard"
import { fiscalSponsorshipExportPath } from "@/lib/profile/fiscal-sponsorship-query"

const MONEY_COLUMN_KEYS = new Set(["amount", "stripeFee", "fiscalFee", "net"])

export function ReceivedDonationsList({
  donations,
  totalCount,
  page,
  limit,
  onPageChange,
  dateFrom,
  dateTo,
  onDateRangeChange,
  isDateFiltered,
}: {
  donations: ReceivedDonationSummary[]
  totalCount: number
  page: number
  limit: number
  onPageChange: (page: number) => void
  dateFrom?: string
  dateTo?: string
  onDateRangeChange: (range: DonationDateRange) => void
  isDateFiltered: boolean
}) {
  const copy = fiscalSponsorshipDashboard.approved
  const columnLabels = copy.donationColumns
  const emptyCopy = isDateFiltered ? copy.emptyFilteredDonations : copy.emptyDonations
  const exportHref = fiscalSponsorshipExportPath({ dateFrom, dateTo })
  const canExport = totalCount > 0

  return (
    <section className="space-y-3" aria-labelledby="received-donations-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <H3 id="received-donations-heading" className="text-lg font-semibold text-gray-900">
            {copy.donationsHeading}
          </H3>
          {donations.length > 0 ? (
            <Text className="text-sm text-gray-600">{copy.donationsAmountHelper}</Text>
          ) : null}
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <DonationDateFilter
            dateFrom={dateFrom}
            dateTo={dateTo}
            onChange={onDateRangeChange}
          />
          {canExport ? (
            <Button
              asChild
              size="sm"
              variant="secondary"
              className={fiscalDashboardButtonClass.secondary}
            >
              <a href={exportHref}>{copy.exportExcel.label}</a>
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              {copy.exportExcel.label}
            </Button>
          )}
        </div>
      </div>

      {donations.length === 0 ? (
        <Card border="dashed" padding="md">
          <Text className="text-center text-sm text-gray-600">{emptyCopy}</Text>
        </Card>
      ) : (
        <>
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.entries(columnLabels).map(([key, label]) => (
                      <th
                        key={key}
                        className={
                          MONEY_COLUMN_KEYS.has(key)
                            ? "px-3 py-2 text-right"
                            : "px-3 py-2 text-left"
                        }
                      >
                        <Text className="text-sm font-medium text-gray-700">{label}</Text>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {donations.map((donation) => (
                    <ReceivedDonationTableRow key={donation.id} donation={donation} />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <ul className="space-y-2 md:hidden">
            {donations.map((donation) => (
              <li key={donation.id}>
                <ReceivedDonationMobileCard donation={donation} />
              </li>
            ))}
          </ul>

          {totalCount > limit ? (
            <AdminPagination
              page={page}
              limit={limit}
              total={totalCount}
              onPageChange={onPageChange}
            />
          ) : null}
        </>
      )}
    </section>
  )
}
