import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth-helpers"
import {
  handleApiError,
  createSuccessResponse,
  validateRequestBody,
  createErrorResponse,
  ErrorCodes,
} from "@/lib/api-utils"
import { createDonationRequestSchema } from "@/lib/validations/donations"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const donationData = validateRequestBody(body, createDonationRequestSchema)

    const auth = await getAuthenticatedUser()
    const supabase = await getSupabaseServerClient()

    let recipientUserId: string | null = donationData.recipient_user_id ?? null
    let recipientName: string | null = null

    if (recipientUserId) {
      const { data: recipientProfile, error: recipientError } = await supabase
        .from("profiles")
        .select("id, name, slug")
        .eq("id", recipientUserId)
        .maybeSingle()

      if (recipientError) {
        console.error("Recipient profile lookup failed:", recipientError)
        return NextResponse.json(
          { error: { code: "INTERNAL_ERROR", message: "Failed to validate recipient" } },
          { status: 500 },
        )
      }

      if (!recipientProfile) {
        return createErrorResponse(ErrorCodes.BAD_REQUEST, "Recipient not found", undefined, 400)
      }

      if (donationData.recipient_slug) {
        const normalized = donationData.recipient_slug.trim().toLowerCase()
        if (!recipientProfile.slug || recipientProfile.slug !== normalized) {
          return createErrorResponse(
            ErrorCodes.BAD_REQUEST,
            "Recipient does not match the donation link",
            undefined,
            400,
          )
        }
      }

      recipientName = recipientProfile.name?.trim() || null
    } else if (donationData.recipient_slug || donationData.recipient_name) {
      return createErrorResponse(
        ErrorCodes.BAD_REQUEST,
        "Invalid recipient parameters for a generic donation",
        undefined,
        400,
      )
    }

    const { data, error } = await supabase
      .from("donations")
      .insert({
        amount: donationData.amount,
        currency: "usd",
        payment_status: "requires_payment",
        donor_id: auth?.user.id ?? null,
        donor_name: donationData.donor_name?.trim() || null,
        donor_email: donationData.donor_email?.trim() || null,
        message: donationData.message?.trim() || null,
        recipient_user_id: recipientUserId,
        recipient_name: recipientName,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Failed to create donation:", error)
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to create donation" } },
        { status: 500 },
      )
    }

    return createSuccessResponse({ id: data.id }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
