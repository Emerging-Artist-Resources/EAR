import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getServerEnv } from "@/lib/env"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { getAuthenticatedUser } from "@/lib/auth-helpers"
import { getUserRoleFromProfile } from "@/lib/authz"
import { handleApiError, createSuccessResponse, validateRequestBody } from "@/lib/api-utils"
import { createDonationSessionRequestSchema } from "@/lib/validations/donations"
import { computeGrossChargeCents } from "@/lib/payments/computeDonationCharge"
import {
  getDonationRecipientByUserId,
  isApprovedRecipient,
} from "@/features/profile/server/artistDonationRecipient"

const STRIPE_API_VERSION = "2026-02-25.clover" as const

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { donationId } = validateRequestBody(body, createDonationSessionRequestSchema)

    const supabase = await getSupabaseServerClient()
    const supabaseService = getSupabaseServiceClient()
    const env = getServerEnv()

    const { data: donationRow, error: donationError } = await supabaseService
      .from("donations")
      .select(
        "id, amount, base_gift_cents, stripe_account, currency, payment_status, donor_id, donor_email, recipient_user_id, recipient_name, message, stripe_checkout_session_id, cover_card_fee, cover_fiscal_fee",
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

    if (!donationRow.currency) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Payment currency not set for this donation" } },
        { status: 400 },
      )
    }

    const baseGiftCents = donationRow.base_gift_cents
    if (baseGiftCents == null || baseGiftCents < 100) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid donation base amount" } },
        { status: 400 },
      )
    }

    if (donationRow.stripe_account !== "sponsor" && donationRow.stripe_account !== "ear") {
      return NextResponse.json(
        {
          error: {
            code: "BAD_REQUEST",
            message: "Donation Stripe account is invalid; refresh and try again",
          },
        },
        { status: 400 },
      )
    }
    const stripeAccount = donationRow.stripe_account

    const donorEmail = donationRow.donor_email?.trim()
    if (!donorEmail) {
      return NextResponse.json(
        { error: "Cannot create checkout without donor email." },
        { status: 400 },
      )
    }

    const sponsorKey = env.STRIPE_SPONSOR_SECRET_KEY
    const useSponsorStripe = stripeAccount === "sponsor"

    if (useSponsorStripe && !sponsorKey) {
      return NextResponse.json(
        {
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Donations are temporarily unavailable",
          },
        },
        { status: 503 },
      )
    }

    let recipientSlug: string | null = null
    if (donationRow.recipient_user_id) {
      const recipientProfile = await getDonationRecipientByUserId(donationRow.recipient_user_id)

      if (!recipientProfile?.slug) {
        return NextResponse.json(
          { error: { code: "BAD_REQUEST", message: "Recipient is no longer available for donations" } },
          { status: 400 },
        )
      }
      if (!isApprovedRecipient(recipientProfile)) {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "This artist is not currently eligible to receive donations" } },
          { status: 403 },
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

    const productLabel = donationRow.recipient_name ? `Donation — ${donationRow.recipient_name}` : "Donation"

    const coverFiscalFee = donationRow.recipient_user_id ? Boolean(donationRow.cover_fiscal_fee) : false
    const unitAmount = computeGrossChargeCents(
      baseGiftCents,
      coverFiscalFee,
      Boolean(donationRow.cover_card_fee),
    )

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: donationRow.currency,
            product_data: {
              name: productLabel,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: donorEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        entity_type: "donation",
        entity_id: donationId,
        stripe_account: stripeAccount,
        donor_id: auth?.user.id || "",
        // Copied onto Payment Intent; webhook can fall back if needed (Stripe metadata value max 500 chars).
        donor_message: (donationRow.message ?? "").trim().slice(0, 450),
        ...(donationRow.recipient_user_id
          ? { recipient_user_id: donationRow.recipient_user_id }
          : {}),
      },
    })

    const { error: updateError } = await supabaseService
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
