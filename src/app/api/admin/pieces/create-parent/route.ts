import { NextRequest } from "next/server"
import { requireRole, hasRole } from "@/lib/auth-helpers"
import { handleApiError, createSuccessResponse, createErrorResponse, ErrorCodes, validateRequestBody } from "@/lib/api-utils"
import { createMinimalParentEventRepo } from "@/features/events/server/admin"
import { z } from "zod"
import { flexibleUrlNullableSchema } from "@/lib/validations/flexible-url"

const createParentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  website: flexibleUrlNullableSchema,
  email: z.string().email().optional().nullable().or(z.literal("")),
  pieceIds: z.array(z.string().uuid()).min(1, "At least one piece ID is required"),
})

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole("REVIEWER")
    
    if (!hasRole(auth.role, ["ADMIN", "REVIEWER"])) {
      return createErrorResponse(ErrorCodes.FORBIDDEN, "Insufficient permissions", undefined, 403)
    }

    const body = await req.json()
    const { name, website, email, pieceIds } = validateRequestBody(body, createParentSchema)

    const result = await createMinimalParentEventRepo({
      name,
      website: website || null,
      email: email || null,
      pieceIds,
    })

    return createSuccessResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}
