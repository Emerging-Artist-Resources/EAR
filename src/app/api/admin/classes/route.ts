import { NextRequest } from "next/server"
import { requireRole, hasRole } from "@/lib/auth-helpers"
import { handleApiError, createSuccessResponse, createErrorResponse, ErrorCodes } from "@/lib/api-utils"
import { listClassesNeedingLinkRepo } from "@/features/events/server/admin"

export async function GET(_req: NextRequest) {
  try {
    const auth = await requireRole("REVIEWER")
    
    if (!hasRole(auth.role, ["ADMIN", "REVIEWER"])) {
      return createErrorResponse(ErrorCodes.FORBIDDEN, "Insufficient permissions", undefined, 403)
    }

    const classes = await listClassesNeedingLinkRepo()
    return createSuccessResponse(classes)
  } catch (error) {
    return handleApiError(error)
  }
}
