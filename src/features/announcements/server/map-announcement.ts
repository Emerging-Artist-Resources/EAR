import {
  isSafeAnnouncementUrl,
  normalizeAnnouncementUrl,
} from "@/features/announcements/announcement-urls"
import { announcementLearnMoreLabel } from "@/features/announcements/popup"
import {
  isDashboardWidgetOn,
  isEnabledByDefault,
  type AdminAnnouncement,
  type Announcement,
  type AnnouncementCta,
  type AnnouncementDashboardWidgetKind,
  type AnnouncementPopup,
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
  dashboard_widget_body?: string | null
  dashboard_learn_more_enabled?: boolean | null
  popup_enabled?: boolean | null
  popup_headline?: string | null
  popup_body?: string | null
  popup_cta_label?: string | null
  popup_learn_more_enabled?: boolean | null
  popup_show_announcement_cta?: boolean | null
  popup_revision?: number | null
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
  if (isDashboardWidgetOn(value)) return value
  return "none"
}

function toPopupRevision(value: number | null | undefined): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 ? value : 1
}

export function mapAnnouncementPopupRow(row: AnnouncementRow): AnnouncementPopup | null {
  if (row.popup_enabled !== true) return null
  if (row.archived_at) return null
  if (!row.published_at) return null
  const headline = row.popup_headline?.trim() || row.title?.trim()
  if (!headline) return null
  return {
    id: row.id,
    headline,
    body: row.popup_body?.trim() || "",
    showLearnMore: isEnabledByDefault(row.popup_learn_more_enabled),
    ctaLabel: announcementLearnMoreLabel(row.popup_cta_label),
    revision: toPopupRevision(row.popup_revision),
    cta: isEnabledByDefault(row.popup_show_announcement_cta)
      ? toAnnouncementCta(row.cta_kind, row.cta_label, row.cta_href)
      : null,
  }
}

export function mapAdminAnnouncementRow(row: AnnouncementRow): AdminAnnouncement {
  const label = row.dashboard_widget_label?.trim()
  const widgetValue = row.dashboard_widget_value?.trim()
  const widgetBody = row.dashboard_widget_body?.trim()
  const headline = row.popup_headline?.trim()
  const body = row.popup_body?.trim()
  const ctaLabel = row.popup_cta_label?.trim()
  return {
    ...mapAnnouncementRow(row),
    archivedAt: row.archived_at ?? null,
    authorUserId: row.author_user_id ?? null,
    dashboardWidget: toDashboardWidget(row.dashboard_widget),
    dashboardWidgetLabel: label || null,
    dashboardWidgetValue: widgetValue || null,
    dashboardWidgetBody: widgetBody || null,
    dashboardLearnMoreEnabled: isEnabledByDefault(row.dashboard_learn_more_enabled),
    popupEnabled: row.popup_enabled === true,
    popupHeadline: headline || null,
    popupBody: body || null,
    popupCtaLabel: ctaLabel || null,
    popupLearnMoreEnabled: isEnabledByDefault(row.popup_learn_more_enabled),
    popupShowAnnouncementCta: isEnabledByDefault(row.popup_show_announcement_cta),
    popupRevision: toPopupRevision(row.popup_revision),
  }
}
