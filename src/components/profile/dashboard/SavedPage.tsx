"use client"

import Link from "next/link"
import { SavedEventsTab } from "@/components/profile/saved-events/SavedEventsTab"
import { DashboardPageLayout } from "./DashboardPageLayout"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/config/constants"

export function SavedPage() {
  return (
    <DashboardPageLayout
      title="Saved"
      description="Events you have bookmarked for later."
      actions={
        <Link href={ROUTES.CALENDAR}>
          <Button variant="primary">Browse calendar</Button>
        </Link>
      }
    >
      <SavedEventsTab hideHeader />
    </DashboardPageLayout>
  )
}
