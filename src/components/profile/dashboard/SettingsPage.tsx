"use client"

import { ProfileSettings } from "@/components/profile/settings/ProfileSettings"
import { DashboardPageLayout } from "./DashboardPageLayout"

export function SettingsPage() {
  return (
    <DashboardPageLayout
      title="Settings"
      description="Newsletter preferences and account security."
    >
      <ProfileSettings />
    </DashboardPageLayout>
  )
}
