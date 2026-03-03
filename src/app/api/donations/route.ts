import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth-helpers"
import { handleApiError, createSuccessResponse, validateRequestBody } from "@/lib/api-utils"
import { createDonationRequestSchema } from "@/lib/validations/donations"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const donationData = validateRequestBody(body, createDonationRequestSchema)

    const auth = await getAuthenticatedUser()
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from("donations")
      .insert({
        amount: donationData.amount,
        currency: "usd",
        payment_status: "requires_payment",
        donor_id: auth?.user.id ?? null,
        donor_name: donationData.donor_name || null,
        donor_email: donationData.donor_email || null,
        message: donationData.message || null,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Failed to create donation:", error)
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to create donation" } },
        { status: 500 }
      )
    }

    return createSuccessResponse({ id: data.id }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
