import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getServerEnv } from "@/lib/env"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { trySendInternalDonationNotifications } from "@/lib/email/trySendInternalDonationNotifications"
import * as Sentry from "@sentry/nextjs"
import { isSentryDisabled } from "@/lib/launch-flags"

// Ensure webhook runs in the Node.js runtime (not edge)
export const runtime = "nodejs"

function constructWebhookEvent(body: string, signature: string, env: ReturnType<typeof getServerEnv>): Stripe.Event {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
  })
  try {
    return stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch (primaryErr) {
    if (env.STRIPE_SPONSOR_WEBHOOK_SECRET) {
      try {
        return stripe.webhooks.constructEvent(body, signature, env.STRIPE_SPONSOR_WEBHOOK_SECRET)
      } catch {
        // fall through to rethrow primary
      }
    } else {
      console.error(
        "STRIPE_SPONSOR_WEBHOOK_SECRET is not configured; sponsor-account webhook signatures cannot be verified.",
      )
    }
    const error = primaryErr as Error
    console.error("Webhook signature verification failed:", error.message)
    throw error
  }
}

export async function POST(req: NextRequest) {
  const env = getServerEnv()
  const supabase = getSupabaseServiceClient()

  const signature = req.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  const body = await req.text()
  let event: Stripe.Event

  try {
    event = constructWebhookEvent(body, signature, env)
  } catch (err) {
    const error = err as Error
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 })
  }

  const eventId = event.id
  const eventType = event.type

  // Idempotency check (maybeSingle: no row is normal on first delivery)
  const { data: existingEventRow, error: existingEventError } = await supabase
    .from("stripe_webhook_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle()

  if (existingEventError) {
    console.error("Webhook idempotency lookup failed:", existingEventError)
    return NextResponse.json({ error: "Idempotency check failed" }, { status: 500 })
  }

  if (existingEventRow) {
    console.log(`Event ${eventId} already processed, skipping`)
    return NextResponse.json({ received: true }, { status: 200 })
  }

  // Extract metadata early for logging and insert
  let listingId: string | null = null
  let donationId: string | null = null

  if (event.data.object && typeof event.data.object === "object" && "metadata" in event.data.object) {
    const metadata = event.data.object.metadata as Record<string, string>
    const entityType = metadata.entity_type
    const entityId = metadata.entity_id

    if (entityType === "listing" && entityId) {
      listingId = entityId
    } else if (entityType === "donation" && entityId) {
      donationId = entityId
    }
  }

  const insertResult = await supabase.from("stripe_webhook_events").insert({
    id: eventId,
    type: eventType,
    listing_id: listingId,
    donation_id: donationId,
    stripe_created: new Date(event.created * 1000).toISOString(),
  })

  if (insertResult.error && insertResult.error.code !== "23505") {
    console.error("Failed to insert webhook event:", insertResult.error)
    // Continue – event may have been inserted concurrently
  }

  console.log(
    `Processing webhook event: ${eventType} (${eventId}), listingId: ${listingId || "N/A"}, donationId: ${
      donationId || "N/A"
    }`,
  )

  try {
    switch (eventType) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.payment_status !== "paid") {
          console.log(`Session ${session.id} payment_status is ${session.payment_status}, not paid`)
          return NextResponse.json({ received: true }, { status: 200 })
        }

        const entityType = session.metadata?.entity_type
        const entityId = session.metadata?.entity_id

        if (!entityType) {
          console.error("No entity_type in session metadata", {
            sessionId: session.id,
            metadata: session.metadata,
          })
          return NextResponse.json({ received: true }, { status: 200 })
        }

        const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null

        if (entityType === "listing") {
          if (!entityId) {
            console.error("No entity_id in session metadata for listing", {
              sessionId: session.id,
              metadata: session.metadata,
            })
            return NextResponse.json({ received: true }, { status: 200 })
          }
          const listing = await supabase
            .from("listings")
            .select("id, payment_status")
            .eq("id", entityId)
            .single()

          if (listing.error || !listing.data) {
            console.error(`Listing ${entityId} not found`, {
              error: listing.error,
              sessionId: session.id,
            })
            return NextResponse.json({ received: true }, { status: 200 })
          }

          if (listing.data.payment_status === "paid") {
            console.log(`Listing ${entityId} already marked as paid`)
            return NextResponse.json({ received: true }, { status: 200 })
          }

          const { error } = await supabase
            .from("listings")
            .update({
              payment_status: "paid",
              stripe_payment_intent_id: paymentIntentId,
              status: "pending",
            })
            .eq("id", entityId)

          if (error) {
            console.error(`Failed to update listing ${entityId}:`, {
              error,
              sessionId: session.id,
              paymentIntentId,
            })
            return NextResponse.json(
              { error: "Failed to update listing", details: error.message },
              { status: 500 },
            )
          }

          console.log(`Updated listing ${entityId} to paid`)
        } else if (entityType === "donation") {
          const bySession = await supabase
            .from("donations")
            .select("id, payment_status")
            .eq("stripe_checkout_session_id", session.id)
            .maybeSingle()

          let resolvedDonationId: string | null = bySession.data?.id ?? null

          if (!resolvedDonationId && entityId) {
            const fallback = await supabase
              .from("donations")
              .select("id, payment_status")
              .eq("id", entityId)
              .maybeSingle()
            resolvedDonationId = fallback.data?.id ?? null
            if (!bySession.data && fallback.data) {
              console.warn("Donation resolved via metadata fallback (no stripe_checkout_session_id match)", {
                sessionId: session.id,
                donationId: entityId,
              })
            }
          }

          if (entityId && resolvedDonationId && entityId !== resolvedDonationId) {
            console.warn("Donation session id and metadata entity_id disagree; using session-linked row", {
              sessionId: session.id,
              fromSession: resolvedDonationId,
              fromMetadata: entityId,
            })
          }

          if (!resolvedDonationId) {
            console.error("Donation not found for checkout session", {
              sessionId: session.id,
              metadataEntityId: entityId,
            })
            return NextResponse.json({ received: true }, { status: 200 })
          }

          const donation = await supabase
            .from("donations")
            .select("id, payment_status")
            .eq("id", resolvedDonationId)
            .single()

          if (donation.error || !donation.data) {
            console.error(`Donation ${resolvedDonationId} not found`, {
              error: donation.error,
              sessionId: session.id,
            })
            return NextResponse.json({ received: true }, { status: 200 })
          }

          if (donation.data.payment_status === "paid") {
            console.log(`Donation ${resolvedDonationId} already marked as paid`)
            console.log("Internal donation notification: invoking helper", {
              donationId: resolvedDonationId,
              source: "checkout.session.completed",
            })
            await trySendInternalDonationNotifications({
              supabase,
              donationId: resolvedDonationId,
              session,
            })
            break
          }

          const paymentIntentIdForDonation =
            typeof session.payment_intent === "string" ? session.payment_intent : null

          const stripeTotal = session.amount_total
          const { error } = await supabase
            .from("donations")
            .update({
              payment_status: "paid",
              stripe_payment_intent_id: paymentIntentIdForDonation,
              ...(stripeTotal != null ? { amount: stripeTotal } : {}),
            })
            .eq("id", resolvedDonationId)

          if (error) {
            console.error(`Failed to update donation ${resolvedDonationId}:`, {
              error,
              sessionId: session.id,
              paymentIntentId: paymentIntentIdForDonation,
            })
            return NextResponse.json(
              { error: "Failed to update donation", details: error.message },
              { status: 500 },
            )
          }

          console.log(`Updated donation ${resolvedDonationId} to paid`)
          console.log("Internal donation notification: invoking helper", {
            donationId: resolvedDonationId,
            source: "checkout.session.completed",
          })
          await trySendInternalDonationNotifications({
            supabase,
            donationId: resolvedDonationId,
            session,
          })
        }

        break
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        const chargeId = typeof paymentIntent.latest_charge === "string" ? paymentIntent.latest_charge : null

        if (!chargeId) {
          return NextResponse.json({ received: true }, { status: 200 })
        }

        const listing = await supabase
          .from("listings")
          .select("id")
          .eq("stripe_payment_intent_id", paymentIntent.id)
          .single()

        if (listing.data) {
          const { error } = await supabase
            .from("listings")
            .update({ stripe_charge_id: chargeId })
            .eq("id", listing.data.id)

          if (error) {
            console.error(`Failed to update listing ${listing.data.id} with charge_id:`, error)
          } else {
            console.log(`Updated listing ${listing.data.id} with charge_id ${chargeId}`)
          }
        } else {
          const donation = await supabase
            .from("donations")
            .select("id")
            .eq("stripe_payment_intent_id", paymentIntent.id)
            .single()

          if (donation.data) {
            const { error } = await supabase
              .from("donations")
              .update({ stripe_charge_id: chargeId })
              .eq("id", donation.data.id)

            if (error) {
              console.error(`Failed to update donation ${donation.data.id} with charge_id:`, error)
            } else {
              console.log(`Updated donation ${donation.data.id} with charge_id ${chargeId}`)
              console.log("Internal donation notification: invoking helper", {
                donationId: donation.data.id,
                source: "payment_intent.succeeded",
              })
              await trySendInternalDonationNotifications({
                supabase,
                donationId: donation.data.id,
                paymentIntent,
              })
            }
          } else {
            console.log(`No listing or donation found for payment_intent ${paymentIntent.id}`)
          }
        }

        break
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge

        const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null
        const chargeId = charge.id

        let listing = null
        let donation = null

        if (paymentIntentId) {
          const listingResult = await supabase
            .from("listings")
            .select("id")
            .eq("stripe_payment_intent_id", paymentIntentId)
            .single()
          listing = listingResult.data

          if (!listing) {
            const donationResult = await supabase
              .from("donations")
              .select("id")
              .eq("stripe_payment_intent_id", paymentIntentId)
              .single()
            donation = donationResult.data
          }
        }

        if (!listing && !donation && chargeId) {
          const listingResult = await supabase
            .from("listings")
            .select("id")
            .eq("stripe_charge_id", chargeId)
            .single()
          listing = listingResult.data

          if (!listing) {
            const donationResult = await supabase
              .from("donations")
              .select("id")
              .eq("stripe_charge_id", chargeId)
              .single()
            donation = donationResult.data
          }
        }

        if (listing) {
          const { error } = await supabase
            .from("listings")
            .update({ payment_status: "refunded" })
            .eq("id", listing.id)

          if (error) {
            console.error(`Failed to update listing ${listing.id} to refunded:`, error)
          } else {
            console.log(`Updated listing ${listing.id} to refunded`)
          }
        } else if (donation) {
          const { error } = await supabase
            .from("donations")
            .update({ payment_status: "refunded" })
            .eq("id", donation.id)

          if (error) {
            console.error(`Failed to update donation ${donation.id} to refunded:`, error)
          } else {
            console.log(`Updated donation ${donation.id} to refunded`)
          }
        } else {
          console.log(`No listing or donation found for refunded charge ${chargeId}`)
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${eventType}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    // 500: Stripe retries. Caveat: `stripe_webhook_events` may already be inserted before this try; retries can hit idempotency and skip re-processing.
    console.error("Error processing webhook:", error)
    if (!isSentryDisabled()) {
      Sentry.captureException(error, { tags: { route: "stripe/webhook" } })
    }
    return new NextResponse("Webhook processing failed", { status: 500 })
  }
}
