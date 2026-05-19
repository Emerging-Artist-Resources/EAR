import { NextRequest, NextResponse } from "next/server"
import { listCalendarItems, sendListingConfirmationEmail, sendAdminListingNotificationEmail } from "@/features/events/server/service"
import { z } from "zod"
import { createEventOwnedRepo, CreateListingInput } from "@/features/events/server/repository"
import { eventPayloadSchema } from "@/features/events/server/event-payload-schema"
import { handleApiError, createSuccessResponse, getQueryParam, getQueryParamArray, validateRequestBody } from "@/lib/api-utils"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth-helpers"
import { checkRateLimit } from "@/services/rate-limit"
import { getClientIpFromRequest } from "@/lib/get-client-ip"
import { rateLimitExceededResponse } from "@/lib/rate-limit-response"

const eventTypeSchema = z.enum(["performance", "audition", "creative", "class", "funding"])

export async function GET(req: NextRequest) {
  try {
    const from = getQueryParam(req, "from") ?? new Date().toISOString()
    const to = getQueryParam(req, "to") ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
    const typesParam = getQueryParamArray(req, "types")
    const types = typesParam
      .map((t) => {
        const result = eventTypeSchema.safeParse(t)
        return result.success ? result.data : null
      })
      .filter((t): t is "performance" | "audition" | "creative" | "class" | "funding" => t !== null)
    //const borough = getQueryParam(req, "borough")

    const data = await listCalendarItems({
      fromISO: from,
      toISO: to,
      types: types.length > 0 ? types as Array<'performance'|'audition'|'creative'|'class'> : undefined,
    })

    return createSuccessResponse(data, 200)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIpFromRequest(req)
    const ipLimit = await checkRateLimit({
      key: `events-post:ip:${ip}`,
      limit: 10,
      window: "1 h",
    })
    if (!ipLimit.allowed) {
      return rateLimitExceededResponse(ipLimit.reset)
    }

    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 })
    }

    const userLimit = await checkRateLimit({
      key: `events-post:user:${auth.user.id}`,
      limit: 20,
      window: "1 h",
    })
    if (!userLimit.allowed) {
      return rateLimitExceededResponse(userLimit.reset)
    }

    const body = await req.json()
    const input = validateRequestBody(body, eventPayloadSchema)
    const supabase = await getSupabaseServerClient()
    const created = await createEventOwnedRepo(supabase, input as unknown as CreateListingInput)
    
    const listing = await supabase
      .from("listings")
      .select("payment_required")
      .eq("id", created.id)
      .single()

    const paymentRequired = listing.data?.payment_required ?? false
    
    try {
      await sendListingConfirmationEmail(input as unknown as CreateListingInput, created.id)
      await sendAdminListingNotificationEmail(input as unknown as CreateListingInput, created.id)
    } catch (emailError) {
      // Email failures don't block listing creation
    }
    
    return createSuccessResponse({ ...created, payment_required: paymentRequired }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
