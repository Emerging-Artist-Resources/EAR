import type { FiscalSponsorshipStatus } from "@/lib/types/fiscal-sponsorship"
import type { ResolvedDashboardAnnouncement } from "@/features/announcements/types"
import type { MemberCodeConfig } from "./member-code-config"

export type DashboardWidgetRow = {
  id: string
  title: string
  content: string
  dashboard_widget?: string | null
  dashboard_widget_label?: string | null
  dashboard_widget_value?: string | null
}

export function getMemberCodeForFiscalSponsorshipStatus(
  status: FiscalSponsorshipStatus | null | undefined,
  codes: MemberCodeConfig
): string {
  return status === "approved" ? codes.fiscalSponsorCode : codes.standardCode
}

function copyableWidget(
  value: string,
  label?: string
): ResolvedDashboardAnnouncement["widget"] {
  return {
    kind: "copyable_value",
    value,
    ...(label ? { label } : {}),
  }
}

export function toResolvedDashboardAnnouncements(
  rows: DashboardWidgetRow[],
  status: FiscalSponsorshipStatus | null | undefined,
  codes: MemberCodeConfig
): ResolvedDashboardAnnouncement[] {
  const memberCode = getMemberCodeForFiscalSponsorshipStatus(status, codes)
  const resolved: ResolvedDashboardAnnouncement[] = []

  for (const row of rows) {
    const label = row.dashboard_widget_label?.trim() || undefined
    if (row.dashboard_widget === "member_code") {
      resolved.push({
        id: row.id,
        title: row.title,
        body: row.content,
        widget: copyableWidget(memberCode, label),
      })
      continue
    }
    if (row.dashboard_widget === "copyable_value") {
      const value = row.dashboard_widget_value?.trim()
      if (!value) continue
      resolved.push({
        id: row.id,
        title: row.title,
        body: row.content,
        widget: copyableWidget(value, label),
      })
    }
  }

  return resolved
}
