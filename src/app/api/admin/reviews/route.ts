import { NextRequest } from "next/server"
import { reviewEvent } from "@/features/reviews/server/service"
import { requireRole } from "@/lib/auth/helpers"
import { handleApiError, createSuccessResponse, validateRequestBody } from "@/lib/api/utils"
import { z } from "zod"

const reviewSchema = z.object({
  eventId: z.string().min(1, "Listing ID is required"), // Keep eventId for backward compatibility with frontend
  decision: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole("ADMIN")

    const body = await request.json()
    const { eventId, decision, notes } = validateRequestBody(body, reviewSchema)

    // Use legacy function name which maps eventId to listingId
    const review = await reviewEvent({
      eventId, // This will be mapped to listingId in the service
      decision,
      notes: notes ?? null,
      reviewerUserId: auth.user.id,
    })

    return createSuccessResponse(review, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
