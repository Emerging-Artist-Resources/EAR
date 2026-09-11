import type { FiscalSponsorshipStatus } from "@/lib/types/fiscal-sponsorship"
import {
  isEnabledByDefault,
  type DashboardCopyableWidget,
  type ResolvedDashboardAnnouncement,
} from "@/features/announcements/types"
import type { MemberCodeConfig } from "./member-code-config"

export type DashboardWidgetRow = {
  id: string
  title: string
  content?: string
  dashboard_widget?: string | null
  dashboard_widget_label?: string | null
  dashboard_widget_value?: string | null
  dashboard_widget_body?: string | null
  dashboard_learn_more_enabled?: boolean | null
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
): DashboardCopyableWidget {
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
    const body = row.dashboard_widget_body?.trim() || ""
    const showLearnMore = isEnabledByDefault(row.dashboard_learn_more_enabled)
    if (row.dashboard_widget === "message") {
      resolved.push({
        id: row.id,
        title: row.title,
        body,
        showLearnMore,
        widget: null,
      })
      continue
    }
    if (row.dashboard_widget === "member_code") {
      resolved.push({
        id: row.id,
        title: row.title,
        body,
        showLearnMore,
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
        body,
        showLearnMore,
        widget: copyableWidget(value, label),
      })
    }
  }

  return resolved
}
