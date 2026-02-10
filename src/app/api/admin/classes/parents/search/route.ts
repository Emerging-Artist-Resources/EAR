import { NextRequest } from "next/server"
import { requireRole, hasRole } from "@/lib/auth-helpers"
import { handleApiError, createSuccessResponse, createErrorResponse, ErrorCodes, getQueryParam } from "@/lib/api-utils"
import { searchParentWorkshopsRepo } from "@/features/events/server/admin"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole("REVIEWER")
    
    if (!hasRole(auth.role, ["ADMIN", "REVIEWER"])) {
      return createErrorResponse(ErrorCodes.FORBIDDEN, "Insufficient permissions", undefined, 403)
    }

    const query = getQueryParam(req, "q", "")
    if (!query || query.trim().length === 0) {
      return createSuccessResponse([])
    }

    const results = await searchParentWorkshopsRepo({ query: query.trim(), limit: 20 })
    return createSuccessResponse(results)
  } catch (error) {
    return handleApiError(error)
  }
}
