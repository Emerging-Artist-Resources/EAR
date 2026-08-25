"use client"

import Link from "next/link"
import { DashboardPageLayout } from "./DashboardPageLayout"
import { Button } from "@/components/ui/button"
import { FiscalSponsorshipSection } from "@/components/profile/fiscal-sponsorship/FiscalSponsorshipSection"
import { useFiscalSponsorshipDashboard } from "@/components/profile/fiscal-sponsorship/useFiscalSponsorshipDashboard"
import {
  fiscalDashboardButtonClass,
} from "@/lib/content/fiscal-sponsorship-dashboard"
import {
  getFiscalSponsorshipHeaderActions,
  type FiscalSponsorshipHeaderAction,
} from "@/lib/profile/fiscal-sponsorship-header-actions"

function FiscalSponsorshipHeaderActionButton({
  action,
}: {
  action: FiscalSponsorshipHeaderAction
}) {
  return (
    <Button
      asChild
      variant={action.variant}
      className={action.variant === "secondary" ? fiscalDashboardButtonClass.secondary : undefined}
    >
      <Link href={action.href}>{action.label}</Link>
    </Button>
  )
}

/** Header owns none/pending actions; status cards are informational only. */
function FiscalSponsorshipHeaderActions({
  actions,
}: {
  actions: FiscalSponsorshipHeaderAction[]
}) {
  if (actions.length === 0) return null

  return (
    <>
      {actions.map((action) => (
        <FiscalSponsorshipHeaderActionButton key={action.id} action={action} />
      ))}
    </>
  )
}

export function FiscalSponsorshipPage() {
  const { data, loading, error, dateFrom, dateTo, setPage, setDateRange, reload } =
    useFiscalSponsorshipDashboard()
  const headerActions = data
    ? getFiscalSponsorshipHeaderActions(data.fiscal_sponsorship_status)
    : []

  return (
    <DashboardPageLayout
      title="Fiscal Sponsorship"
      description="Manage your fiscal sponsorship status and view donations received through EAR."
      actions={
        headerActions.length > 0 ? (
          <FiscalSponsorshipHeaderActions actions={headerActions} />
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
