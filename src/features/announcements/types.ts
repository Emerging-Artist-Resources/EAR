export type AnnouncementCta =
  | { kind: "link"; label: string; href: string }
  | { kind: "authenticated_link"; label: string; href: string }

export type AnnouncementCtaKind = AnnouncementCta["kind"]

export const DASHBOARD_WIDGET_ON_KINDS = ["message", "copyable_value", "member_code"] as const

export type AnnouncementDashboardWidgetOnKind = (typeof DASHBOARD_WIDGET_ON_KINDS)[number]
export type AnnouncementDashboardWidgetKind = "none" | AnnouncementDashboardWidgetOnKind

export const DEFAULT_DASHBOARD_WIDGET: AnnouncementDashboardWidgetOnKind = "message"

export function isDashboardWidgetOn(
  kind?: AnnouncementDashboardWidgetKind | string | null
): kind is AnnouncementDashboardWidgetOnKind {
  return DASHBOARD_WIDGET_ON_KINDS.some((onKind) => onKind === kind)
}

export function isCopyableDashboardWidget(
  kind?: AnnouncementDashboardWidgetKind | string | null
): kind is "copyable_value" | "member_code" {
  return kind === "copyable_value" || kind === "member_code"
}

/** Boolean columns that default on. Missing/null (pre-migration) stays on. */
export function isEnabledByDefault(value: boolean | null | undefined): boolean {
  return value !== false
}

/** Public announcement — safe for client, list cards, and public APIs. Never includes member codes. */
export type Announcement = {
  id: string
  title: string
  content: string
  publishedAt: string | null
  createdAt?: string | null
  heroImageUrl: string | null
  cta: AnnouncementCta | null
}

/** Public first-visit popup. Never includes member codes or dashboard values. */
export type AnnouncementPopup = {
  id: string
  headline: string
  body: string
  showLearnMore: boolean
  ctaLabel: string
  revision: number
  cta: AnnouncementCta | null
}

export type AdminAnnouncement = Announcement & {
  archivedAt: string | null
  authorUserId: string | null
  dashboardWidget: AnnouncementDashboardWidgetKind
  dashboardWidgetLabel: string | null
  dashboardWidgetValue: string | null
  dashboardWidgetBody: string | null
  dashboardLearnMoreEnabled: boolean
  popupEnabled: boolean
  popupHeadline: string | null
  popupBody: string | null
  popupCtaLabel: string | null
  popupLearnMoreEnabled: boolean
  popupShowAnnouncementCta: boolean
  popupRevision: number
}

/** Signed-in dashboard payload. Values are already resolved; never returned by public APIs. */
export type DashboardCopyableWidget = {
  kind: "copyable_value"
  value: string
  label?: string
}

export type ResolvedDashboardAnnouncement = {
  id: string
  title: string
  body: string
  showLearnMore: boolean
  widget: DashboardCopyableWidget | null
}
