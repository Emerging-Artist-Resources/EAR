import { NextRequest } from "next/server"
import {
  listAdminProfiles,
  updateProfileStatus,
  markProfileReviewed,
  updateFiscalSponsorshipStatus,
} from "@/features/users/server/service"
import { requireRole } from "@/lib/auth-helpers"
import { handleApiError, createSuccessResponse, validateRequestBody } from "@/lib/api-utils"
import { z } from "zod"

const updateProfileSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  status: z.enum(["emerging", "established"]).optional(),
  reviewedAt: z.boolean().optional(),
  fiscalSponsorshipStatus: z.enum(["none", "pending", "approved", "paused", "revoked"]).optional(),
  fiscalSponsorshipNote: z.string().trim().max(1000).optional().nullable(),
}).refine((data) => data.status !== undefined || data.reviewedAt === true || data.fiscalSponsorshipStatus !== undefined, {
  message: "Provide status, reviewedAt, or fiscalSponsorshipStatus",
}).refine((data) => {
  if (data.fiscalSponsorshipStatus === "paused" || data.fiscalSponsorshipStatus === "revoked") {
    return Boolean(data.fiscalSponsorshipNote?.trim())
  }
  return true
}, {
  message: "Fiscal sponsorship note is required when status is paused or revoked",
  path: ["fiscalSponsorshipNote"],
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
    const auth = await requireRole("ADMIN")

    const body = await request.json()
    const { userId, status, reviewedAt, fiscalSponsorshipStatus, fiscalSponsorshipNote } = validateRequestBody(
      body,
      updateProfileSchema,
    )

    if (status !== undefined) {
      const updated = await updateProfileStatus(userId, status)
      return createSuccessResponse(updated)
    }

    if (fiscalSponsorshipStatus !== undefined) {
      const updated = await updateFiscalSponsorshipStatus(
        userId,
        fiscalSponsorshipStatus,
        auth.user.id,
        fiscalSponsorshipNote ?? undefined,
      )
      return createSuccessResponse(updated)
    }

    if (reviewedAt === true) {
      const updated = await markProfileReviewed(userId)
      return createSuccessResponse(updated)
    }

    return handleApiError(new Error("Invalid request: must provide status, reviewedAt, or fiscalSponsorshipStatus"))
  } catch (error) {
    return handleApiError(error)
  }
}
