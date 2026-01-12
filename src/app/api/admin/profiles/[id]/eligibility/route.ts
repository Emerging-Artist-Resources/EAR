import { NextRequest } from "next/server"
import { getAdminEligibilitySubmissions } from "@/features/users/server/service"
import { requireRole } from "@/lib/auth-helpers"
import { handleApiError, createSuccessResponse } from "@/lib/api-utils"

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN")
    const { id } = await ctx.params
    const submissions = await getAdminEligibilitySubmissions(id)
    return createSuccessResponse(submissions)
  } catch (error) {
    return handleApiError(error)
  }
}
