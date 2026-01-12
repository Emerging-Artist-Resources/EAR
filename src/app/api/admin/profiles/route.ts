import { NextRequest } from "next/server"
import { listAdminProfiles, updateProfileStatus, markProfileReviewed } from "@/features/users/server/service"
import { requireRole } from "@/lib/auth-helpers"
import { handleApiError, createSuccessResponse, validateRequestBody } from "@/lib/api-utils"
import { z } from "zod"

const updateProfileSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  status: z.enum(["emerging", "established"]).optional(),
  reviewedAt: z.boolean().optional(),
}).refine((data) => data.status !== undefined || data.reviewedAt === true, {
  message: "Either status or reviewedAt must be provided",
})

export async function GET() {
  try {
    await requireRole("ADMIN")
    const profiles = await listAdminProfiles()
    return createSuccessResponse(profiles)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole("ADMIN")

    const body = await request.json()
    const { userId, status, reviewedAt } = validateRequestBody(body, updateProfileSchema)

    if (status !== undefined) {
      const updated = await updateProfileStatus(userId, status)
      return createSuccessResponse(updated)
    }

    if (reviewedAt === true) {
      const updated = await markProfileReviewed(userId)
      return createSuccessResponse(updated)
    }

    return handleApiError(new Error("Invalid request: must provide status or reviewedAt"))
  } catch (error) {
    return handleApiError(error)
  }
}
