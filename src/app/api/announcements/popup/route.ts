import { getActivePopupAnnouncement } from "@/features/announcements/server/service"
import { createSuccessResponse, handleApiError } from "@/lib/api/utils"

export async function GET() {
  try {
    const data = await getActivePopupAnnouncement()
    return createSuccessResponse(data)
  } catch (error) {
    return handleApiError(error)
  }
}
