import { NextRequest } from "next/server"
import { announcementSchema } from "@/lib/validations/announcements"
import {
  listAnnouncements,
  listAnnouncementsAdmin,
  createAnnouncement,
} from "@/features/announcements/server/service"
import { requireRole } from "@/lib/auth/helpers"
import {
  createSuccessResponse,
  getQueryParam,
  handleApiError,
} from "@/lib/api/utils"

export async function GET(request: NextRequest) {
  try {
    const isAdminList = getQueryParam(request, "admin") === "true"
    if (isAdminList) {
      await requireRole("ADMIN")
      const data = await listAnnouncementsAdmin()
      return createSuccessResponse(data)
    }

    const data = await listAnnouncements()
    return createSuccessResponse(data)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole("ADMIN")

    const body = await request.json()
    const validated = announcementSchema.parse(body)
    const data = await createAnnouncement({
      title: validated.title,
      content: validated.content,
      authorUserId: auth.user.id,
      heroImageUrl: validated.heroImageUrl,
      ctaKind: validated.ctaKind,
      ctaLabel: validated.ctaLabel,
      ctaHref: validated.ctaHref,
      ctaSecondaryKind: validated.ctaSecondaryKind,
      ctaSecondaryLabel: validated.ctaSecondaryLabel,
      ctaSecondaryHref: validated.ctaSecondaryHref,
      dashboardWidget: validated.dashboardWidget,
      dashboardWidgetLabel: validated.dashboardWidgetLabel,
      dashboardWidgetValue: validated.dashboardWidgetValue,
      dashboardWidgetBody: validated.dashboardWidgetBody,
      dashboardLearnMoreEnabled: validated.dashboardLearnMoreEnabled,
      popupEnabled: validated.popupEnabled,
      popupHeadline: validated.popupHeadline,
      popupBody: validated.popupBody,
      popupCtaLabel: validated.popupCtaLabel,
      popupLearnMoreEnabled: validated.popupLearnMoreEnabled,
      popupShowAnnouncementCta: validated.popupShowAnnouncementCta,
      popupRevision: validated.popupRevision,
    })
    return createSuccessResponse(data, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
