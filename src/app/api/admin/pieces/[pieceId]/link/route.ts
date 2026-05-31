import { NextRequest } from "next/server"
import { requireRole, hasRole } from "@/lib/auth/helpers"
import { handleApiError, createSuccessResponse, createErrorResponse, ErrorCodes, validateRequestBody } from "@/lib/api/utils"
import { updatePieceParentLinkRepo } from "@/features/events/server/admin"
import { z } from "zod"

const linkPieceSchema = z.object({
  parentListingId: z.string().uuid(),
})

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ pieceId: string }> }
) {
  try {
    const auth = await requireRole("REVIEWER")
    
    if (!hasRole(auth.role, ["ADMIN", "REVIEWER"])) {
      return createErrorResponse(ErrorCodes.FORBIDDEN, "Insufficient permissions", undefined, 403)
    }

    const { pieceId } = await ctx.params
    const body = await req.json()
    const { parentListingId } = validateRequestBody(body, linkPieceSchema)

    await updatePieceParentLinkRepo({
      pieceListingId: pieceId,
      parentListingId,
      createdBy: auth.user.id,
    })

    return createSuccessResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
