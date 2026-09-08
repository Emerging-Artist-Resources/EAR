export type AnnouncementCta =
  | { kind: "link"; label: string; href: string }
  | { kind: "authenticated_link"; label: string; href: string }

export type AnnouncementCtaKind = AnnouncementCta["kind"]

export type AnnouncementDashboardWidgetKind = "none" | "copyable_value" | "member_code"

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
  popupEnabled: boolean
  popupHeadline: string | null
  popupBody: string | null
  popupCtaLabel: string | null
  popupRevision: number
}

/** Signed-in dashboard payload. Values are already resolved; never returned by public APIs. */
export type ResolvedDashboardAnnouncement = {
  id: string
  title: string
  body: string
  widget: {
    kind: "copyable_value"
    value: string
    label?: string
  }
}
