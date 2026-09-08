import {
  listAnnouncementsRepo,
  getAnnouncementRepo,
  createAnnouncementRepo,
  updateAnnouncementRepo,
  deleteAnnouncementRepo,
  listAnnouncementsRepoAdmin,
  listDashboardWidgetAnnouncementsRepo,
} from "./repository"
import { announcementPatchSchema, announcementSchema } from "@/lib/validations/announcements"
import { normalizeAnnouncementUrl } from "@/features/announcements/announcement-urls"
import { mapAdminAnnouncementRow, mapAnnouncementRow } from "./map-announcement"
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
