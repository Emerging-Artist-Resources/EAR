import { H3, Text } from "@/components/ui/typography"
import { Card } from "@/components/ui/card"
import { AdminPagination } from "@/components/admin/AdminPagination"
import { ReceivedDonationRow } from "./ReceivedDonationRow"
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

  return (
    <section className="space-y-3" aria-labelledby="received-donations-heading">
      <H3 id="received-donations-heading" className="text-lg font-semibold text-gray-900">
        {copy.donationsHeading}
      </H3>

      {donations.length === 0 ? (
        <Card border="dashed" padding="md">
          <Text className="text-center text-sm text-gray-600">{copy.emptyDonations}</Text>
        </Card>
      ) : (
        <>
          <ul className="space-y-2">
            {donations.map((donation) => (
              <li key={donation.id}>
                <ReceivedDonationRow donation={donation} />
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
