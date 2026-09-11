import { z } from "zod"

import { isSafeAnnouncementUrl } from "@/features/announcements/announcement-urls"

const emptyToNull = (raw: unknown) => {
  if (raw === undefined) return undefined
  if (raw === null) return null
  const s = String(raw).trim()
  return s === "" ? null : s
}

export const announcementCtaKindSchema = z.enum(["link", "authenticated_link"])
export const announcementDashboardWidgetSchema = z.enum([
  "none",
  "message",
  "copyable_value",
  "member_code",
])

export const announcementFieldsSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().min(1, "Content is required"),
  isActive: z.boolean().optional(),
  heroImageUrl: z.preprocess(emptyToNull, z.string().nullable().optional()),
  ctaKind: z.preprocess(emptyToNull, announcementCtaKindSchema.nullable().optional()),
  ctaLabel: z.preprocess(emptyToNull, z.string().max(80).nullable().optional()),
  ctaHref: z.preprocess(emptyToNull, z.string().nullable().optional()),
  dashboardWidget: z.preprocess(emptyToNull, announcementDashboardWidgetSchema.nullable().optional()),
  dashboardWidgetLabel: z.preprocess(emptyToNull, z.string().max(80).nullable().optional()),
  dashboardWidgetValue: z.preprocess(emptyToNull, z.string().max(80).nullable().optional()),
  dashboardWidgetBody: z.preprocess(emptyToNull, z.string().max(500).nullable().optional()),
  dashboardLearnMoreEnabled: z.boolean().optional(),
  popupEnabled: z.boolean().optional(),
  popupHeadline: z.preprocess(emptyToNull, z.string().max(120).nullable().optional()),
  popupBody: z.preprocess(emptyToNull, z.string().max(500).nullable().optional()),
  popupCtaLabel: z.preprocess(emptyToNull, z.string().max(80).nullable().optional()),
  popupLearnMoreEnabled: z.boolean().optional(),
  popupShowAnnouncementCta: z.boolean().optional(),
  popupRevision: z.number().int().min(1).optional(),
})

function refineAnnouncementFields(
  data: {
    heroImageUrl?: string | null
    ctaKind?: "link" | "authenticated_link" | null
    ctaLabel?: string | null
    ctaHref?: string | null
    dashboardWidget?: "none" | "message" | "copyable_value" | "member_code" | null
    dashboardWidgetValue?: string | null
    popupEnabled?: boolean
    popupHeadline?: string | null
  },
  ctx: z.RefinementCtx
) {
  if (data.heroImageUrl != null && !isSafeAnnouncementUrl(data.heroImageUrl)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a valid image URL or site path",
      path: ["heroImageUrl"],
    })
  }

  if (data.dashboardWidget === "copyable_value" && data.dashboardWidgetValue == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter the value to show on the dashboard",
      path: ["dashboardWidgetValue"],
    })
  }

  if (data.popupEnabled === true && data.popupHeadline == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a popup headline",
      path: ["popupHeadline"],
    })
  }

  const hasAnyCta = data.ctaKind != null || data.ctaLabel != null || data.ctaHref != null
  if (!hasAnyCta) return

  if (data.ctaKind == null || data.ctaLabel == null || data.ctaHref == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "CTA needs a kind, label, and link",
      path: ["ctaKind"],
    })
    return
  }

  if (!isSafeAnnouncementUrl(data.ctaHref)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a valid link or site path",
      path: ["ctaHref"],
    })
  }
}

export const announcementSchema = announcementFieldsSchema.superRefine(refineAnnouncementFields)

export const announcementPatchSchema = announcementFieldsSchema
  .partial()
  .superRefine(refineAnnouncementFields)

export type AnnouncementFormData = z.infer<typeof announcementSchema>
