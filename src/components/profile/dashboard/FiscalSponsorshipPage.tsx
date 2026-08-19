"use client"

import Link from "next/link"
import { DashboardPageLayout } from "./DashboardPageLayout"
import { Button } from "@/components/ui/button"
import { FiscalSponsorshipSection } from "@/components/profile/fiscal-sponsorship/FiscalSponsorshipSection"
import { useFiscalSponsorshipDashboard } from "@/components/profile/fiscal-sponsorship/useFiscalSponsorshipDashboard"
import {
  FISCAL_SPONSORSHIP_INQUIRY_HREF,
  FISCAL_SPONSORSHIP_PAGE_HREF,
  fiscalDashboardButtonClass,
} from "@/lib/content/fiscal-sponsorship-dashboard"

export function FiscalSponsorshipPage() {
  const { data, loading, error, dateFrom, dateTo, setPage, setDateRange, reload } =
    useFiscalSponsorshipDashboard()
  const showApplyActions =
    data != null && data.fiscal_sponsorship_status !== "approved"

  return (
    <DashboardPageLayout
      title="Fiscal Sponsorship"
      description="Manage your fiscal sponsorship status and view donations received through EAR."
      actions={
        showApplyActions ? (
          <>
            <Button asChild variant="primary">
              <Link href={FISCAL_SPONSORSHIP_PAGE_HREF}>Learn about fiscal sponsorship</Link>
            </Button>
            <Button asChild variant="secondary" className={fiscalDashboardButtonClass.secondary}>
              <Link href={FISCAL_SPONSORSHIP_INQUIRY_HREF}>Apply</Link>
            </Button>
          </>
        ) : undefined
      }
    >
      <FiscalSponsorshipSection
        data={data}
        loading={loading}
        error={error}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onPageChange={setPage}
        onDateRangeChange={setDateRange}
        onDonationPageUpdated={reload}
      />
    </DashboardPageLayout>
  )
}
