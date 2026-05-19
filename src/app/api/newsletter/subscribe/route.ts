import { NextRequest } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth-helpers"
import {
  handleApiError,
  createSuccessResponse,
  validateRequestBody,
  createErrorResponse,
  ErrorCodes,
} from "@/lib/api-utils"
import { newsletterSubscribeRequestSchema } from "@/lib/validations/newsletter"
import { syncNewsletterPreferences } from "@/features/newsletter/server/syncNewsletterPreferences"
import type { NewsletterSource } from "@/features/newsletter/constants"
import {
  checkNewsletterSubscribeRateLimit,
  getClientIpFromRequest,
} from "@/features/newsletter/server/rateLimit"

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIpFromRequest(req)
    const { allowed } = checkNewsletterSubscribeRateLimit(ip)
    if (!allowed) {
      return createErrorResponse(
        ErrorCodes.BAD_REQUEST,
        "Too many requests. Please try again later.",
        undefined,
        429,
      )
    }

    const body = await req.json()
    const data = validateRequestBody(body, newsletterSubscribeRequestSchema)

    const auth = await getAuthenticatedUser()
    const profileId = auth?.user.id

    const source = (data.source ?? "modal") as NewsletterSource

    const row = await syncNewsletterPreferences({
      email: data.email,
      earOptIn: data.subscribed_to_newsletter,
      calendarOptIn: data.subscribed_to_calendar,
      profileId: profileId ?? undefined,
      source,
      sourceContext: data.source_context,
    })

    return createSuccessResponse(
      {
        id: row.id,
        email: row.email,
        subscribed_to_newsletter: row.subscribed_to_newsletter,
        subscribed_to_calendar: row.subscribed_to_calendar,
      },
      201,
    )
  } catch (error) {
    return handleApiError(error)
  }
}
