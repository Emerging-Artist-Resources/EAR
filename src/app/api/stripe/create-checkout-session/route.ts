import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getServerEnv } from "@/lib/env"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth-helpers"
import { getUserRoleFromProfile } from "@/lib/authz"
import { handleApiError, createSuccessResponse, validateRequestBody } from "@/lib/api-utils"
import { z } from "zod"

const requestSchema = z.object({
  listingId: z.string().uuid("Invalid listing ID"),
})

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 })
    }

    const body = await req.json()
    const { listingId } = validateRequestBody(body, requestSchema)

    const supabase = await getSupabaseServerClient()
    const env = getServerEnv()

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    })

    const listing = await supabase
      .from("listings")
      .select("id, type, created_by, payment_required, payment_amount, payment_currency, payment_status")
      .eq("id", listingId)
      .single()

    if (listing.error || !listing.data) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Listing not found" } },
        { status: 404 }
      )
    }

    const listingData = listing.data

    if (listingData.payment_status === "paid") {
      return NextResponse.json({ already_paid: true }, { status: 200 })
    }

    const userRole = await getUserRoleFromProfile(supabase, auth.user.id)
    const isAdmin = userRole === "ADMIN"
    const isOwner = listingData.created_by === auth.user.id

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You are not authorized to pay for this listing" } },
        { status: 403 }
      )
    }

    if (!listingData.payment_required || listingData.payment_status !== "requires_payment") {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Payment is not required for this listing" } },
        { status: 400 }
      )
    }

    if (!listingData.payment_amount || !listingData.payment_currency) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Payment amount not set for this listing" } },
        { status: 400 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: listingData.payment_currency,
            product_data: {
              name: `Listing Fee - ${listingData.type}`,
            },
            unit_amount: listingData.payment_amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.nextUrl.origin}/forms/payment-success?session_id={CHECKOUT_SESSION_ID}&listing_id=${listingId}`,
      cancel_url: `${req.nextUrl.origin}/forms/payment-cancel?listing_id=${listingId}`,
      metadata: {
        entity_type: "listing",
        entity_id: listingId,
        listing_type: listingData.type,
        submitted_by: auth.user.id,
      },
    })

    const { error: updateError } = await supabase
      .from("listings")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", listingId)

    if (updateError) {
      console.error("Failed to update listing with checkout session ID:", updateError)
    }

    return createSuccessResponse({ url: session.url }, 200)
  } catch (error) {
    return handleApiError(error)
  }
}
