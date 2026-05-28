import { NextRequest } from "next/server"
import { requireRole, hasRole } from "@/lib/auth/helpers"
import { handleApiError, createSuccessResponse, createErrorResponse, ErrorCodes, validateRequestBody } from "@/lib/api/utils"
import { updateClassParentLinkRepo } from "@/features/events/server/admin"
import { z } from "zod"

const linkClassSchema = z.object({
  parentListingId: z.string().uuid(),
})

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ classId: string }> }
) {
  try {
    const auth = await requireRole("REVIEWER")
    
    if (!hasRole(auth.role, ["ADMIN", "REVIEWER"])) {
      return createErrorResponse(ErrorCodes.FORBIDDEN, "Insufficient permissions", undefined, 403)
    }

    const { classId } = await ctx.params
    const body = await req.json()
    const { parentListingId } = validateRequestBody(body, linkClassSchema)

    await updateClassParentLinkRepo({
      classListingId: classId,
      parentListingId,
      createdBy: auth.user.id,
    })

    return createSuccessResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
