"use client"

import { CollapsibleSidebar } from "@/components/shared/CollapsibleSidebar"
import { ROUTES } from "@/lib/constants"
import { dashboardNavItems } from "@/lib/navigation/dashboard-nav"

const DASHBOARD_SIDEBAR_STORAGE_KEY = "dashboard-sidebar-collapsed"

const dashboardSections = [
  {
    items: dashboardNavItems.map((item) => ({
      ...item,
      exact: item.href === ROUTES.PROFILE,
    })),
  },
]

export function DashboardSidebar() {
  return (
    <CollapsibleSidebar
      title="Dashboard"
      storageKey={DASHBOARD_SIDEBAR_STORAGE_KEY}
      sections={dashboardSections}
    />
  )
}
