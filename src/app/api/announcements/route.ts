import { NextRequest } from "next/server"
import { notificationSchema } from "@/lib/validations/legacy-schemas"
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
    const validated = notificationSchema.parse(body)
    const data = await createAnnouncement({
      title: validated.title,
      content: validated.content,
      type: validated.type,
      authorUserId: auth.user.id,
    })
    return createSuccessResponse(data, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
