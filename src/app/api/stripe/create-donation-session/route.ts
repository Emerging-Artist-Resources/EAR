import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getServerEnv } from "@/lib/env"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth-helpers"
import { getUserRoleFromProfile } from "@/lib/authz"
import { handleApiError, createSuccessResponse, validateRequestBody } from "@/lib/api-utils"
import { createDonationSessionRequestSchema } from "@/lib/validations/donations"

const STRIPE_API_VERSION = "2026-02-25.clover" as const

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { donationId } = validateRequestBody(body, createDonationSessionRequestSchema)

    const supabase = await getSupabaseServerClient()
    const env = getServerEnv()

    const { data: donationRow, error: donationError } = await supabase
      .from("donations")
      .select(
        "id, amount, currency, payment_status, donor_id, recipient_user_id, recipient_name, stripe_checkout_session_id",
      )
      .eq("id", donationId)
      .single()

    if (donationError || !donationRow) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Donation not found" } },
        { status: 404 },
      )
    }

    if (donationRow.payment_status === "paid") {
      return NextResponse.json({ already_paid: true }, { status: 200 })
    }

    const auth = await getAuthenticatedUser()
    if (auth) {
      const userRole = await getUserRoleFromProfile(supabase, auth.user.id)
      const isAdmin = userRole === "ADMIN"
      const isOwner = donationRow.donor_id === auth.user.id

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "You are not authorized to pay for this donation" } },
          { status: 403 },
        )
      }
    }

    if (donationRow.payment_status !== "requires_payment") {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Payment is not required for this donation" } },
        { status: 400 },
      )
    }

    if (!donationRow.amount || !donationRow.currency) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Payment amount not set for this donation" } },
        { status: 400 },
      )
    }

    const sponsorKey = env.STRIPE_SPONSOR_SECRET_KEY
    const useSponsorStripe = Boolean(donationRow.recipient_user_id)

    if (useSponsorStripe && !sponsorKey) {
      return NextResponse.json(
        {
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Artist donations are temporarily unavailable",
          },
        },
        { status: 503 },
      )
    }

    let recipientSlug: string | null = null
    if (donationRow.recipient_user_id) {
      const { data: recipientProfile, error: recipientError } = await supabase
        .from("profiles")
        .select("id, slug")
        .eq("id", donationRow.recipient_user_id)
        .maybeSingle()

      if (recipientError || !recipientProfile?.slug) {
        return NextResponse.json(
          { error: { code: "BAD_REQUEST", message: "Recipient is no longer available for donations" } },
          { status: 400 },
        )
      }
      recipientSlug = recipientProfile.slug
    }

    const stripeSecret = useSponsorStripe ? sponsorKey! : env.STRIPE_SECRET_KEY
    const stripe = new Stripe(stripeSecret, {
      apiVersion: STRIPE_API_VERSION,
    })

    if (donationRow.stripe_checkout_session_id) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(donationRow.stripe_checkout_session_id)
        if (existing.status === "open" && existing.url) {
          return createSuccessResponse({ url: existing.url }, 200)
        }
      } catch (e) {
        console.warn("Could not reuse checkout session, creating a new one:", e)
      }
    }

    const origin = req.nextUrl.origin
    const successUrl = recipientSlug
      ? `${origin}/donate/${encodeURIComponent(recipientSlug)}/success?donation_id=${donationId}&session_id={CHECKOUT_SESSION_ID}`
      : `${origin}/donations/success?session_id={CHECKOUT_SESSION_ID}&donation_id=${donationId}`
    const cancelUrl = recipientSlug
      ? `${origin}/donate/${encodeURIComponent(recipientSlug)}?canceled=true`
      : `${origin}/donations/cancel?donation_id=${donationId}`

    const productLabel =
      useSponsorStripe && donationRow.recipient_name
        ? `Donation — ${donationRow.recipient_name}`
        : "Donation"

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: donationRow.currency,
            product_data: {
              name: productLabel,
            },
            unit_amount: donationRow.amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        entity_type: "donation",
        entity_id: donationId,
        donor_id: auth?.user.id || "",
        ...(donationRow.recipient_user_id
          ? { recipient_user_id: donationRow.recipient_user_id }
          : {}),
      },
    })

    const { error: updateError } = await supabase
      .from("donations")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", donationId)

    if (updateError) {
      console.error("Failed to update donation with checkout session ID:", updateError)
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to save checkout session" } },
        { status: 500 },
      )
    }

    return createSuccessResponse({ url: session.url }, 200)
  } catch (error) {
    return handleApiError(error)
  }
}
