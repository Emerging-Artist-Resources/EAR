import { NextRequest } from "next/server"
import { getOptionalEnv } from "@/lib/config/env"
import { createErrorResponse, createSuccessResponse, ErrorCodes, handleApiError } from "@/lib/api/utils"
import { retryPendingNewsletterSyncs } from "@/features/newsletter/server/mailchimp"
import { getLaunchFlags } from "@/lib/launch-flags"

export async function POST(req: NextRequest) {
  try {
    const secret = getOptionalEnv("CRON_SECRET")
    if (!secret) {
      return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "CRON_SECRET not configured", undefined, 500)
    }

    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${secret}`) {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized", undefined, 401)
    }

    if (getLaunchFlags().disableBackgroundSync) {
      console.warn("[newsletter] cron skipped (DISABLE_BACKGROUND_SYNC)")
      return createSuccessResponse({ processed: 0, skipped: true })
    }

    const processed = await retryPendingNewsletterSyncs(50)
    return createSuccessResponse({ processed })
  } catch (error) {
    return handleApiError(error)
  }
}
