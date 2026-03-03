import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getServerEnv } from "@/lib/env"
import { getSupabaseServiceClient } from "@/lib/supabase/service"

export async function POST(req: NextRequest) {
  const env = getServerEnv()
  const supabase = getSupabaseServiceClient()
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
  })

  const signature = req.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  const body = await req.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const error = err as Error
    console.error("Webhook signature verification failed:", error.message)
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 })
  }

  const eventId = event.id
  const eventType = event.type

  const existingEvent = await supabase
    .from("stripe_webhook_events")
    .select("id")
    .eq("id", eventId)
    .single()

  if (existingEvent.data) {
    console.log(`Event ${eventId} already processed, skipping`)
    return NextResponse.json({ received: true }, { status: 200 })
  }

  let listingId: string | null = null

  if (event.data.object && typeof event.data.object === "object" && "metadata" in event.data.object) {
    const metadata = event.data.object.metadata as Record<string, string>
    if (metadata.entity_type === "listing" && metadata.entity_id) {
      listingId = metadata.entity_id
    }
  }

  const insertResult = await supabase.from("stripe_webhook_events").insert({
    id: eventId,
    type: eventType,
    listing_id: listingId,
    stripe_created: new Date(event.created * 1000).toISOString(),
  })

  if (insertResult.error && insertResult.error.code !== "23505") {
    console.error("Failed to insert webhook event:", insertResult.error)
  }

  console.log(`Processing webhook event: ${eventType} (${eventId}), listingId: ${listingId || "N/A"}`)

  try {
    switch (eventType) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.payment_status !== "paid") {
          console.log(`Session ${session.id} payment_status is ${session.payment_status}, not paid`)
          return NextResponse.json({ received: true }, { status: 200 })
        }

        const entityId = session.metadata?.entity_id
        if (!entityId) {
          console.error("No entity_id in session metadata")
          return NextResponse.json({ received: true }, { status: 200 })
        }

        const listing = await supabase
          .from("listings")
          .select("id, payment_status")
          .eq("id", entityId)
          .single()

        if (listing.error || !listing.data) {
          console.error(`Listing ${entityId} not found`)
          return NextResponse.json({ received: true }, { status: 200 })
        }

        if (listing.data.payment_status === "paid") {
          console.log(`Listing ${entityId} already marked as paid`)
          return NextResponse.json({ received: true }, { status: 200 })
        }

        const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null

        const { error } = await supabase
          .from("listings")
          .update({
            payment_status: "paid",
            stripe_payment_intent_id: paymentIntentId,
            status: "pending",
          })
          .eq("id", entityId)

        if (error) {
          console.error(`Failed to update listing ${entityId}:`, error)
          return NextResponse.json({ received: true }, { status: 200 })
        }

        console.log(`Updated listing ${entityId} to paid`)
        break
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        const listing = await supabase
          .from("listings")
          .select("id")
          .eq("stripe_payment_intent_id", paymentIntent.id)
          .single()

        if (listing.error || !listing.data) {
          console.log(`No listing found for payment_intent ${paymentIntent.id}`)
          return NextResponse.json({ received: true }, { status: 200 })
        }

        const chargeId = typeof paymentIntent.latest_charge === "string" ? paymentIntent.latest_charge : null

        if (chargeId) {
          const { error } = await supabase
            .from("listings")
            .update({ stripe_charge_id: chargeId })
            .eq("id", listing.data.id)

          if (error) {
            console.error(`Failed to update listing ${listing.data.id} with charge_id:`, error)
          } else {
            console.log(`Updated listing ${listing.data.id} with charge_id ${chargeId}`)
          }
        }
        break
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge

        const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null
        const chargeId = charge.id

        let listing = null

        if (paymentIntentId) {
          const result = await supabase
            .from("listings")
            .select("id")
            .eq("stripe_payment_intent_id", paymentIntentId)
            .single()
          listing = result.data
        }

        if (!listing && chargeId) {
          const result = await supabase
            .from("listings")
            .select("id")
            .eq("stripe_charge_id", chargeId)
            .single()
          listing = result.data
        }

        if (!listing) {
          console.log(`No listing found for refunded charge ${chargeId}`)
          return NextResponse.json({ received: true }, { status: 200 })
        }

        const { error } = await supabase
          .from("listings")
          .update({ payment_status: "refunded" })
          .eq("id", listing.id)

        if (error) {
          console.error(`Failed to update listing ${listing.id} to refunded:`, error)
        } else {
          console.log(`Updated listing ${listing.id} to refunded`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${eventType}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
