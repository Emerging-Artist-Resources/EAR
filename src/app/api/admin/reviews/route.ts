import { NextRequest } from "next/server"
import { reviewEvent } from "@/features/reviews/server/service"
import { requireRole } from "@/lib/auth-helpers"
import { handleApiError, createSuccessResponse, validateRequestBody, ErrorCodes, createErrorResponse } from "@/lib/api-utils"
import { z } from "zod"

const reviewSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  decision: z.enum(["APPROVED", "REJECTED"], {
    errorMap: () => ({ message: "Decision must be APPROVED or REJECTED" }),
  }),
  notes: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole("ADMIN")

    const body = await request.json()
    const { eventId, decision, notes } = validateRequestBody(body, reviewSchema)

    const review = await reviewEvent({
      eventId,
      decision,
      notes: notes ?? null,
      reviewerUserId: auth.user.id,
    })

    return createSuccessResponse(review, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
