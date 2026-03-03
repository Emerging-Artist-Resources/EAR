import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getServerEnv } from "@/lib/env"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth-helpers"
import { getUserRoleFromProfile } from "@/lib/authz"
import { handleApiError, createSuccessResponse, validateRequestBody } from "@/lib/api-utils"
import { createDonationSessionRequestSchema } from "@/lib/validations/donations"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { donationId } = validateRequestBody(body, createDonationSessionRequestSchema)

    const supabase = await getSupabaseServerClient()
    const env = getServerEnv()

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    })

    const donation = await supabase
      .from("donations")
      .select("id, amount, currency, payment_status, donor_id")
      .eq("id", donationId)
      .single()

    if (donation.error || !donation.data) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Donation not found" } },
        { status: 404 }
      )
    }

    const donationData = donation.data

    if (donationData.payment_status === "paid") {
      return NextResponse.json({ already_paid: true }, { status: 200 })
    }

    const auth = await getAuthenticatedUser()
    if (auth) {
      const userRole = await getUserRoleFromProfile(supabase, auth.user.id)
      const isAdmin = userRole === "ADMIN"
      const isOwner = donationData.donor_id === auth.user.id

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "You are not authorized to pay for this donation" } },
          { status: 403 }
        )
      }
    }

    if (donationData.payment_status !== "requires_payment") {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Payment is not required for this donation" } },
        { status: 400 }
      )
    }

    if (!donationData.amount || !donationData.currency) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Payment amount not set for this donation" } },
        { status: 400 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: donationData.currency,
            product_data: {
              name: "Donation",
            },
            unit_amount: donationData.amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.nextUrl.origin}/donations/success?session_id={CHECKOUT_SESSION_ID}&donation_id=${donationId}`,
      cancel_url: `${req.nextUrl.origin}/donations/cancel?donation_id=${donationId}`,
      metadata: {
        entity_type: "donation",
        entity_id: donationId,
        donor_id: auth?.user.id || "",
      },
    })

    const { error: updateError } = await supabase
      .from("donations")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", donationId)

    if (updateError) {
      console.error("Failed to update donation with checkout session ID:", updateError)
    }

    return createSuccessResponse({ url: session.url }, 200)
  } catch (error) {
    return handleApiError(error)
  }
}
