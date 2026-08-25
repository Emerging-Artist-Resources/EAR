"use client"

import { useState } from "react"
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
import {
  downloadFiscalSponsorshipExport,
  formatDonationExportTruncatedToast,
} from "@/lib/profile/download-fiscal-sponsorship-export"
import { useToast } from "@/contexts/ToastContext"

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
  const canExport = totalCount > 0
  const { showToast } = useToast()
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    if (!canExport || exporting) return

    setExporting(true)
    try {
      const meta = await downloadFiscalSponsorshipExport({ dateFrom, dateTo })
      if (meta.truncated) {
        showToast(formatDonationExportTruncatedToast(meta), "warning")
      } else {
        showToast(copy.exportExcel.successToast, "success")
      }
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : copy.exportExcel.errorToast
      showToast(message, "error")
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="space-y-3" aria-labelledby="received-donations-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <H3 id="received-donations-heading" className="text-lg font-semibold text-gray-900">
            {copy.donationsHeading}
          </H3>
          {donations.length > 0 ? (
            <div className="space-y-1">
              <Text className="text-sm text-gray-600">{copy.donationsAmountHelper}</Text>
              <Text className="text-sm text-gray-600">{copy.donationsFeeEstimateHelper}</Text>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <DonationDateFilter
            dateFrom={dateFrom}
            dateTo={dateTo}
            onChange={onDateRangeChange}
          />
          <Button
            type="button"
            size="sm"
            variant={canExport ? "secondary" : "outline"}
            className={canExport ? fiscalDashboardButtonClass.secondary : undefined}
            disabled={!canExport || exporting}
            onClick={handleExport}
          >
            {exporting ? copy.exportExcel.exportingLabel : copy.exportExcel.label}
          </Button>
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
