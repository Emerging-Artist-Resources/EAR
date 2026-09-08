import {
  listAnnouncementsRepo,
  getAnnouncementRepo,
  createAnnouncementRepo,
  updateAnnouncementRepo,
  deleteAnnouncementRepo,
  listAnnouncementsRepoAdmin,
  listDashboardWidgetAnnouncementsRepo,
  getActivePopupAnnouncementRepo,
} from "./repository"
import { announcementPatchSchema, announcementSchema } from "@/lib/validations/announcements"
import { normalizeAnnouncementUrl } from "@/features/announcements/announcement-urls"
import { mapAdminAnnouncementRow, mapAnnouncementPopupRow, mapAnnouncementRow } from "./map-announcement"
import { getProfileRepo } from "@/features/profile/server/repository"
import { getMemberCodeConfig } from "./member-code-config"
import { toResolvedDashboardAnnouncements } from "./member-code"

function ctaColumns(parsed: {
  ctaKind?: "link" | "authenticated_link" | null
  ctaLabel?: string | null
  ctaHref?: string | null
}) {
  const href = parsed.ctaHref != null ? normalizeAnnouncementUrl(parsed.ctaHref) : null
  const kind = parsed.ctaKind ?? null
  const label = parsed.ctaLabel ?? null
  if (!kind || !label || !href) {
    return { cta_kind: null, cta_label: null, cta_href: null }
  }
  return { cta_kind: kind, cta_label: label, cta_href: href }
}

function dashboardColumns(parsed: {
  dashboardWidget?: "none" | "copyable_value" | "member_code" | null
  dashboardWidgetLabel?: string | null
  dashboardWidgetValue?: string | null
}) {
  const widget =
    parsed.dashboardWidget === "member_code" || parsed.dashboardWidget === "copyable_value"
      ? parsed.dashboardWidget
      : "none"
  const label = widget === "none" ? null : parsed.dashboardWidgetLabel?.trim() || null
  const value = widget === "copyable_value" ? parsed.dashboardWidgetValue?.trim() || null : null
  return {
    dashboard_widget: widget,
    dashboard_widget_label: label,
    dashboard_widget_value: value,
  }
}

function popupColumns(parsed: {
  popupEnabled?: boolean
  popupHeadline?: string | null
  popupBody?: string | null
  popupCtaLabel?: string | null
  popupRevision?: number
}) {
  const columns: Record<string, unknown> = {}
  if (parsed.popupEnabled !== undefined) columns.popup_enabled = parsed.popupEnabled === true
  if (parsed.popupHeadline !== undefined) columns.popup_headline = parsed.popupHeadline?.trim() || null
  if (parsed.popupBody !== undefined) columns.popup_body = parsed.popupBody?.trim() || null
  if (parsed.popupCtaLabel !== undefined) columns.popup_cta_label = parsed.popupCtaLabel?.trim() || null
  if (parsed.popupRevision !== undefined) columns.popup_revision = parsed.popupRevision
  return columns
}

function hasPopupFields(parsed: {
  popupEnabled?: boolean
  popupHeadline?: string | null
  popupBody?: string | null
  popupCtaLabel?: string | null
  popupRevision?: number
}) {
  return (
    parsed.popupEnabled !== undefined ||
    parsed.popupHeadline !== undefined ||
    parsed.popupBody !== undefined ||
    parsed.popupCtaLabel !== undefined ||
    parsed.popupRevision !== undefined
  )
}

function heroColumn(heroImageUrl: string | null | undefined) {
  if (heroImageUrl == null) return null
  return normalizeAnnouncementUrl(heroImageUrl)
}

export async function listAnnouncements() {
  const data = await listAnnouncementsRepo()
  return data.map(mapAnnouncementRow)
}

export async function getResolvedDashboardAnnouncements(userId: string) {
  const rows = await listDashboardWidgetAnnouncementsRepo()
  if (rows.length === 0) return []
  const profile = await getProfileRepo(userId)
  return toResolvedDashboardAnnouncements(
    rows,
    profile?.fiscal_sponsorship_status ?? null,
    getMemberCodeConfig()
  )
}

export async function listAnnouncementsAdmin() {
  const data = await listAnnouncementsRepoAdmin()
  return data.map(mapAdminAnnouncementRow)
}

export async function getAnnouncement(id: string) {
  const row = await getAnnouncementRepo(id)
  return row ? mapAnnouncementRow(row) : null
}

export async function getActivePopupAnnouncement() {
  const row = await getActivePopupAnnouncementRepo()
  return row ? mapAnnouncementPopupRow(row) : null
}

export async function createAnnouncement(input: {
  title: string
  content: string
  authorUserId: string
  heroImageUrl?: string | null
  ctaKind?: "link" | "authenticated_link" | null
  ctaLabel?: string | null
  ctaHref?: string | null
  dashboardWidget?: "none" | "copyable_value" | "member_code" | null
  dashboardWidgetLabel?: string | null
  dashboardWidgetValue?: string | null
  popupEnabled?: boolean
  popupHeadline?: string | null
  popupBody?: string | null
  popupCtaLabel?: string | null
  popupRevision?: number
}) {
  const parsed = announcementSchema.parse({
    title: input.title,
    content: input.content,
    heroImageUrl: input.heroImageUrl,
    ctaKind: input.ctaKind,
    ctaLabel: input.ctaLabel,
    ctaHref: input.ctaHref,
    dashboardWidget: input.dashboardWidget,
    dashboardWidgetLabel: input.dashboardWidgetLabel,
    dashboardWidgetValue: input.dashboardWidgetValue,
    popupEnabled: input.popupEnabled,
    popupHeadline: input.popupHeadline,
    popupBody: input.popupBody,
    popupCtaLabel: input.popupCtaLabel,
    popupRevision: input.popupRevision,
  })
  const row = await createAnnouncementRepo({
    title: parsed.title,
    content: parsed.content,
    author_user_id: input.authorUserId,
    published_at: new Date(),
    archived_at: null,
    ...(parsed.heroImageUrl != null ? { hero_image_url: heroColumn(parsed.heroImageUrl) } : {}),
    ...(parsed.ctaKind ? ctaColumns(parsed) : {}),
    ...(parsed.dashboardWidget === "member_code" || parsed.dashboardWidget === "copyable_value"
      ? dashboardColumns(parsed)
      : {}),
    ...(hasPopupFields(parsed) ? popupColumns(parsed) : {}),
  })
  return mapAdminAnnouncementRow(row)
}

export async function updateAnnouncement(id: string, body: unknown) {
  const partial = announcementPatchSchema.parse(body)
  const updatePayload: Record<string, unknown> = {}
  if (partial.title !== undefined) updatePayload.title = partial.title
  if (partial.content !== undefined) updatePayload.content = partial.content
  if (partial.heroImageUrl !== undefined) {
    updatePayload.hero_image_url = heroColumn(partial.heroImageUrl)
  }
  if (
    partial.ctaKind !== undefined ||
    partial.ctaLabel !== undefined ||
    partial.ctaHref !== undefined
  ) {
    Object.assign(updatePayload, ctaColumns(partial))
  }
  if (
    partial.dashboardWidget !== undefined ||
    partial.dashboardWidgetLabel !== undefined ||
    partial.dashboardWidgetValue !== undefined
  ) {
    Object.assign(updatePayload, dashboardColumns(partial))
  }
  if (hasPopupFields(partial)) {
    Object.assign(updatePayload, popupColumns(partial))
  }
  if (Object.prototype.hasOwnProperty.call(body as Record<string, unknown>, "isActive")) {
    const isActive = Boolean((body as Record<string, unknown>).isActive)
    updatePayload.archived_at = isActive ? null : new Date()
    if (isActive && !("published_at" in updatePayload)) updatePayload.published_at = new Date()
  }
  const row = await updateAnnouncementRepo(id, updatePayload)
  return mapAdminAnnouncementRow(row)
}

export async function deleteAnnouncement(id: string) {
  return deleteAnnouncementRepo(id)
}
