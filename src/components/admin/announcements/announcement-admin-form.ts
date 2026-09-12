import {
  isCopyableDashboardWidget,
  isDashboardWidgetOn,
  type AdminAnnouncement,
  type AnnouncementCtaKind,
  type AnnouncementDashboardWidgetKind,
} from "@/features/announcements/types"

export type AnnouncementAdminFormState = {
  title: string
  content: string
  heroImageUrl: string
  ctaKind: "" | AnnouncementCtaKind
  ctaLabel: string
  ctaHref: string
  ctaSecondaryKind: "" | AnnouncementCtaKind
  ctaSecondaryLabel: string
  ctaSecondaryHref: string
  dashboardWidget: AnnouncementDashboardWidgetKind
  dashboardWidgetLabel: string
  dashboardWidgetValue: string
  dashboardWidgetBody: string
  dashboardLearnMoreEnabled: boolean
  popupEnabled: boolean
  popupHeadline: string
  popupBody: string
  popupCtaLabel: string
  popupLearnMoreEnabled: boolean
  popupShowAnnouncementCta: boolean
  popupShowAgain: boolean
  isActive: boolean
}

export const emptyAnnouncementForm: AnnouncementAdminFormState = {
  title: "",
  content: "",
  heroImageUrl: "",
  ctaKind: "",
  ctaLabel: "",
  ctaHref: "",
  ctaSecondaryKind: "",
  ctaSecondaryLabel: "",
  ctaSecondaryHref: "",
  dashboardWidget: "none",
  dashboardWidgetLabel: "",
  dashboardWidgetValue: "",
  dashboardWidgetBody: "",
  dashboardLearnMoreEnabled: true,
  popupEnabled: false,
  popupHeadline: "",
  popupBody: "",
  popupCtaLabel: "",
  popupLearnMoreEnabled: true,
  popupShowAnnouncementCta: true,
  popupShowAgain: false,
  isActive: true,
}

export function formFromAnnouncement(a: AdminAnnouncement): AnnouncementAdminFormState {
  return {
    title: a.title,
    content: a.content,
    heroImageUrl: a.heroImageUrl ?? "",
    ctaKind: a.cta?.kind ?? "",
    ctaLabel: a.cta?.label ?? "",
    ctaHref: a.cta?.href ?? "",
    ctaSecondaryKind: a.secondaryCta?.kind ?? "",
    ctaSecondaryLabel: a.secondaryCta?.label ?? "",
    ctaSecondaryHref: a.secondaryCta?.href ?? "",
    dashboardWidget: a.dashboardWidget ?? "none",
    dashboardWidgetLabel: a.dashboardWidgetLabel ?? "",
    dashboardWidgetValue: a.dashboardWidgetValue ?? "",
    dashboardWidgetBody: a.dashboardWidgetBody ?? "",
    dashboardLearnMoreEnabled: a.dashboardLearnMoreEnabled ?? true,
    popupEnabled: a.popupEnabled ?? false,
    popupHeadline: a.popupHeadline ?? "",
    popupBody: a.popupBody ?? "",
    popupCtaLabel: a.popupCtaLabel ?? "",
    popupLearnMoreEnabled: a.popupLearnMoreEnabled ?? true,
    popupShowAnnouncementCta: a.popupShowAnnouncementCta ?? true,
    popupShowAgain: false,
    isActive: !a.archivedAt,
  }
}

function ctaSaveFields(kind: "" | AnnouncementCtaKind, label: string, href: string) {
  if (!kind) return { kind: null, label: null, href: null }
  return { kind, label, href }
}

export function toAnnouncementSavePayload(
  form: AnnouncementAdminFormState,
  editing: AdminAnnouncement | null
): Record<string, unknown> {
  const dashboardOn = isDashboardWidgetOn(form.dashboardWidget)
  const primary = ctaSaveFields(form.ctaKind, form.ctaLabel, form.ctaHref)
  const secondary = ctaSaveFields(
    form.ctaSecondaryKind,
    form.ctaSecondaryLabel,
    form.ctaSecondaryHref
  )
  const payload: Record<string, unknown> = {
    title: form.title,
    content: form.content,
    isActive: form.isActive,
    heroImageUrl: form.heroImageUrl.trim() || undefined,
    ctaKind: primary.kind,
    ctaLabel: primary.label,
    ctaHref: primary.href,
    ctaSecondaryKind: secondary.kind,
    ctaSecondaryLabel: secondary.label,
    ctaSecondaryHref: secondary.href,
    popupEnabled: form.popupEnabled,
    popupHeadline: form.popupHeadline.trim() || null,
    popupBody: form.popupBody.trim() || null,
    popupCtaLabel: form.popupCtaLabel.trim() || null,
    popupLearnMoreEnabled: form.popupLearnMoreEnabled,
    popupShowAnnouncementCta: form.popupShowAnnouncementCta,
  }

  if (dashboardOn || isDashboardWidgetOn(editing?.dashboardWidget)) {
    payload.dashboardWidget = form.dashboardWidget
    payload.dashboardWidgetLabel = isCopyableDashboardWidget(form.dashboardWidget)
      ? form.dashboardWidgetLabel
      : null
    payload.dashboardWidgetValue =
      form.dashboardWidget === "copyable_value" ? form.dashboardWidgetValue : null
    payload.dashboardWidgetBody = dashboardOn ? form.dashboardWidgetBody.trim() || null : null
    payload.dashboardLearnMoreEnabled = form.dashboardLearnMoreEnabled
  }

  if (form.popupEnabled && form.popupShowAgain) {
    payload.popupRevision = (editing?.popupRevision ?? 1) + 1
  }

  return payload
}
