import { VscAccount } from "react-icons/vsc"
import { DashboardSummaryCard } from "./DashboardSummaryCard"
import { ROUTES } from "@/lib/constants"

export function ProfileShortcutCard() {
  return (
    <DashboardSummaryCard
      title="Profile"
      description="Update your artist identity and contact details"
      href={ROUTES.PROFILE_ACCOUNT}
      colorClass="bg-gray-50"
      icon={VscAccount}
    />
  )
}
