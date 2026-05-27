"use client"

import { MyInfoTab } from "@/components/profile/info/MyInfoTab"
import { DashboardPageLayout } from "./DashboardPageLayout"

export function AccountPage() {
  return (
    <DashboardPageLayout
      title="Profile"
      description="Update your artist identity and contact information."
    >
      <MyInfoTab />
    </DashboardPageLayout>
  )
}
