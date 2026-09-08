import {
  isSafeAnnouncementUrl,
  normalizeAnnouncementUrl,
} from "@/features/announcements/announcement-urls"
import type {
  AdminAnnouncement,
  Announcement,
  AnnouncementCta,
  AnnouncementDashboardWidgetKind,
} from "@/features/announcements/types"

export type AnnouncementRow = {
  id: string
  title: string
  content: string
  author_user_id?: string | null
  published_at?: string | null
  archived_at?: string | null
  created_at?: string | null
  hero_image_url?: string | null
  cta_kind?: string | null
  cta_label?: string | null
  cta_href?: string | null
  dashboard_widget?: string | null
  dashboard_widget_label?: string | null
  dashboard_widget_value?: string | null
}

export function toAnnouncementCta(
  kind: string | null | undefined,
  label: string | null | undefined,
  href: string | null | undefined
): AnnouncementCta | null {
  if (kind !== "link" && kind !== "authenticated_link") return null
  const trimmedLabel = label?.trim()
  const normalizedHref = href?.trim() ? normalizeAnnouncementUrl(href) : null
  if (!trimmedLabel || !normalizedHref) return null
  return { kind, label: trimmedLabel, href: normalizedHref }
}

export function mapAnnouncementRow(row: AnnouncementRow): Announcement {
  const hero = row.hero_image_url?.trim()
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    publishedAt: row.published_at ?? null,
    createdAt: row.created_at ?? null,
    heroImageUrl: hero && isSafeAnnouncementUrl(hero) ? normalizeAnnouncementUrl(hero) : null,
    cta: toAnnouncementCta(row.cta_kind, row.cta_label, row.cta_href),
  }
}

export function toDashboardWidget(
  value: string | null | undefined
): AnnouncementDashboardWidgetKind {
  if (value === "member_code" || value === "copyable_value") return value
  return "none"
}

export function mapAdminAnnouncementRow(row: AnnouncementRow): AdminAnnouncement {
  const label = row.dashboard_widget_label?.trim()
  const widgetValue = row.dashboard_widget_value?.trim()
  return {
    ...mapAnnouncementRow(row),
    archivedAt: row.archived_at ?? null,
    authorUserId: row.author_user_id ?? null,
    dashboardWidget: toDashboardWidget(row.dashboard_widget),
    dashboardWidgetLabel: label || null,
    dashboardWidgetValue: widgetValue || null,
  }
}
