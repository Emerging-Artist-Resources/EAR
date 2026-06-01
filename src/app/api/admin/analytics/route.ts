import { NextRequest } from "next/server"
import { getAdminAnalytics } from "@/features/analytics/server/service"
import { requireRole } from "@/lib/auth/helpers"
import { createSuccessResponse, getQueryParam, handleApiError } from "@/lib/api/utils"

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN")
    const range = getQueryParam(req, "range", "30d")
    const analytics = await getAdminAnalytics(range)
    return createSuccessResponse(analytics)
  } catch (error) {
    return handleApiError(error)
  }
}
