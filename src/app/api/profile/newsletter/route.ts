import { NextRequest } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth/helpers"
import {
  handleApiError,
  createSuccessResponse,
  validateRequestBody,
  createErrorResponse,
  ErrorCodes,
} from "@/lib/api/utils"
import { newsletterProfileUpdateSchema } from "@/lib/validations/newsletter"
import {
  getNewsletterPreferencesByProfile,
  syncNewsletterPreferences,
} from "@/features/newsletter/server/syncNewsletterPreferences"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized", undefined, 401)
    }

    const supabase = await getSupabaseServerClient()
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", auth.user.id)
      .single()

    if (error || !profile?.email) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, "Profile not found", undefined, 404)
    }

    const prefs = await getNewsletterPreferencesByProfile(auth.user.id, profile.email)

    return createSuccessResponse({
      subscribed_to_newsletter: prefs.earOptIn,
      subscribed_to_calendar: prefs.calendarOptIn,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return createErrorResponse(ErrorCodes.UNAUTHORIZED, "Unauthorized", undefined, 401)
    }

    const body = await req.json()
    const data = validateRequestBody(body, newsletterProfileUpdateSchema)

    const supabase = await getSupabaseServerClient()
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", auth.user.id)
      .single()

    if (error || !profile?.email) {
      return createErrorResponse(ErrorCodes.NOT_FOUND, "Profile not found", undefined, 404)
    }

    const row = await syncNewsletterPreferences({
      email: profile.email,
      earOptIn: data.subscribed_to_newsletter,
      calendarOptIn: data.subscribed_to_calendar,
      profileId: auth.user.id,
      source: "profile",
    })

    return createSuccessResponse({
      subscribed_to_newsletter: row.subscribed_to_newsletter,
      subscribed_to_calendar: row.subscribed_to_calendar,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
