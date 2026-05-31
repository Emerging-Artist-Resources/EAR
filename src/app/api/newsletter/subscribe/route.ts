import { NextRequest } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth/helpers"
import {
  handleApiError,
  createSuccessResponse,
  validateRequestBody,
} from "@/lib/api/utils"
import { newsletterSubscribeRequestSchema } from "@/lib/validations/newsletter"
import { syncNewsletterPreferences } from "@/features/newsletter/server/syncNewsletterPreferences"
import type { NewsletterSource } from "@/features/newsletter/constants"
import { getClientIpFromRequest } from "@/lib/get-client-ip"
import { checkRateLimit } from "@/services/rate-limit"
import { rateLimitExceededResponse } from "@/lib/rate-limit-response"

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIpFromRequest(req)
    const rate = await checkRateLimit({
      key: `newsletter-subscribe:${ip}`,
      limit: 5,
      window: "15 m",
    })
    if (!rate.allowed) {
      return rateLimitExceededResponse(rate.reset)
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
      firstName: data.first_name,
      lastName: data.last_name,
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
