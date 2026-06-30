import { H3, Text } from "@/components/ui/typography"
import { Card } from "@/components/ui/card"
import { AdminPagination } from "@/components/admin/AdminPagination"
import {
  ReceivedDonationMobileCard,
  ReceivedDonationTableRow,
} from "./ReceivedDonationRow"
import type { ReceivedDonationSummary } from "@/features/profile/server/types"
import { fiscalSponsorshipDashboard } from "@/lib/content/fiscal-sponsorship-dashboard"

export function ReceivedDonationsList({
  donations,
  totalCount,
  page,
  limit,
  onPageChange,
}: {
  donations: ReceivedDonationSummary[]
  totalCount: number
  page: number
  limit: number
  onPageChange: (page: number) => void
}) {
  const copy = fiscalSponsorshipDashboard.approved
  const columnLabels = copy.donationColumns

  return (
    <section className="space-y-3" aria-labelledby="received-donations-heading">
      <div className="space-y-1">
        <H3 id="received-donations-heading" className="text-lg font-semibold text-gray-900">
          {copy.donationsHeading}
        </H3>
        {donations.length > 0 ? (
          <Text className="text-sm text-gray-600">{copy.donationsAmountHelper}</Text>
        ) : null}
      </div>

      {donations.length === 0 ? (
        <Card border="dashed" padding="md">
          <Text className="text-center text-sm text-gray-600">{copy.emptyDonations}</Text>
        </Card>
      ) : (
        <>
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">
                      <Text className="text-sm font-medium text-gray-700">{columnLabels.donor}</Text>
                    </th>
                    <th className="px-3 py-2 text-left">
                      <Text className="text-sm font-medium text-gray-700">{columnLabels.email}</Text>
                    </th>
                    <th className="px-3 py-2 text-left">
                      <Text className="text-sm font-medium text-gray-700">{columnLabels.date}</Text>
                    </th>
                    <th className="px-3 py-2 text-right">
                      <Text className="text-sm font-medium text-gray-700">{columnLabels.amount}</Text>
                    </th>
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
