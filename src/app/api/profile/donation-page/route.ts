import { NextRequest } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth/helpers"
import {
  handleApiError,
  createSuccessResponse,
  validateRequestBody,
  createErrorResponse,
  ErrorCodes,
} from "@/lib/api/utils"
import {
  updateDonationPageSchema,
} from "@/lib/validations/donation-page"
import { getDonationRecipientByUserId, isApprovedRecipient } from "@/features/profile/server/artistDonationRecipient"
import {
  sendDonationPageUpdatedAdminEmail,
  updateDonationPage,
} from "@/features/profile/server/service"

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized", undefined, 401)
    }

    const body = await request.json()
    const data = validateRequestBody(body, updateDonationPageSchema)

    const recipient = await getDonationRecipientByUserId(auth.user.id)
    if (!recipient) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, "Profile not found", undefined, 404)
    }

    if (!isApprovedRecipient(recipient)) {
      return createErrorResponse(
        ErrorCodes.FORBIDDEN,
        "Fiscal sponsorship must be approved to customize your donation page",
        undefined,
        403,
      )
    }

    if (!recipient.slug?.trim()) {
      return createErrorResponse(
        ErrorCodes.BAD_REQUEST,
        "Your public donation link is not set up yet",
        undefined,
        400,
      )
    }

    const { donationPage, changed } = await updateDonationPage(auth.user.id, data)

    if (changed) {
      await sendDonationPageUpdatedAdminEmail({
        user: auth.user,
        recipient,
        donationPage,
      })
    }

    return createSuccessResponse(donationPage)
  } catch (error) {
    return handleApiError(error)
  }
}
