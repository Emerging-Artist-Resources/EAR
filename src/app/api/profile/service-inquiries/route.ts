import { getAuthenticatedUser } from "@/lib/auth-helpers"
import { handleApiError, createSuccessResponse } from "@/lib/api-utils"
import { getServiceInquiries } from "@/features/profile/server/service"

export async function GET() {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return handleApiError(new Error("Unauthorized"))
    }

    const rows = await getServiceInquiries(auth.user.id)
    return createSuccessResponse(rows)
  } catch (error) {
    return handleApiError(error)
  }
}
