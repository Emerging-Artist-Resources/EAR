# Stripe Payment Integration Documentation

## Overview

This document describes the Stripe payment integration for listing fees, including architecture, design decisions, and how to extend it for other payment types (e.g., donations) and perform operations like refunds.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Current Implementation](#current-implementation)
3. [Design Decisions](#design-decisions)
4. [Adding Other Payment Types](#adding-other-payment-types)
5. [Refunds and Other Operations](#refunds-and-other-operations)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

## Architecture Overview

The Stripe integration uses **Stripe Checkout** (prebuilt payment page) with webhook-based event processing. This architecture provides:

- **Security**: Payment amounts are never trusted from the client
- **Reliability**: Webhooks ensure payment status is always accurate
- **Idempotency**: Prevents duplicate processing of payments
- **Extensibility**: Metadata-based design allows adding new payment types

### Key Components

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ 1. Submit listing
       ▼
┌─────────────────┐
│  /api/events    │ Creates listing, calculates fee
└──────┬──────────┘
       │ 2. Returns payment_required
       ▼
┌─────────────────────────────┐
│  /api/stripe/               │
│  create-checkout-session    │ Creates Stripe session
└──────┬──────────────────────┘
       │ 3. Redirects to Stripe
       ▼
┌─────────────┐
│   Stripe    │ User completes payment
│   Checkout  │
└──────┬──────┘
       │ 4. Webhook events
       ▼
┌─────────────────────────────┐
│  /api/stripe/webhook         │ Updates payment status
└──────┬──────────────────────┘
       │ 5. Updates database
       ▼
┌─────────────┐
│  Database   │ payment_status = 'paid'
└─────────────┘
```

## Current Implementation

### Database Schema

#### Payment Fields on `listings` Table

```sql
payment_required BOOLEAN NOT NULL DEFAULT false
payment_amount INTEGER                    -- Amount in cents
payment_currency TEXT NOT NULL DEFAULT 'usd'
payment_status payment_status NOT NULL DEFAULT 'not_required'
stripe_checkout_session_id TEXT          -- Set when creating session
stripe_payment_intent_id TEXT             -- Set from webhook (source of truth)
stripe_charge_id TEXT                     -- Set from payment_intent.succeeded
```

#### Payment Status Enum

```sql
CREATE TYPE payment_status AS ENUM (
  'not_required',      -- No payment needed (waiver, comp tickets, etc.)
  'requires_payment',  -- Payment is required but not yet paid
  'paid',              -- Payment completed successfully
  'refunded',          -- Payment was refunded
  'canceled'           -- User canceled or session expired
);
```

#### Webhook Events Table

```sql
CREATE TABLE stripe_webhook_events (
  id TEXT PRIMARY KEY,                    -- Stripe event ID
  type TEXT NOT NULL,                     -- Event type (e.g., checkout.session.completed)
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  stripe_created TIMESTAMPTZ,             -- Stripe event timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### API Routes

#### 1. Create Checkout Session (`/api/stripe/create-checkout-session`)

**Purpose**: Creates a Stripe Checkout session for a listing that requires payment.

**Input**:
```json
{
  "listingId": "uuid"
}
```

**Security**:
- Only accepts `listingId` (never accepts amount from client)
- Verifies user owns the listing or is an admin
- Checks if payment is already completed (idempotency)
- Looks up `payment_amount` from database

**Process**:
1. Verify authentication and ownership
2. Check if already paid (return `already_paid: true`)
3. Fetch listing and verify `payment_required = true`
4. Create Stripe Checkout session with metadata:
   ```json
   {
     "entity_type": "listing",
     "entity_id": "listing-uuid",
     "listing_type": "class",
     "submitted_by": "user-uuid"
   }
   ```
5. Update listing with `stripe_checkout_session_id`
6. Return `{ url: "https://checkout.stripe.com/..." }`

**Response**:
```json
{
  "data": {
    "url": "https://checkout.stripe.com/pay/cs_..."
  }
}
```

#### 2. Webhook Handler (`/api/stripe/webhook`)

**Purpose**: Processes Stripe webhook events to update payment status.

**Critical Processing Order**:
1. **Verify Stripe signature** (reject if invalid)
2. **Parse event** from request body
3. **Check idempotency** (query `stripe_webhook_events` table)
4. **Extract entity_id** from metadata (if available)
5. **Insert event** into `stripe_webhook_events` table
6. **Process business logic** based on event type

**Handled Events**:

##### `checkout.session.completed`
- Verifies `session.payment_status === "paid"`
- Updates listing:
  - `payment_status = 'paid'`
  - `stripe_payment_intent_id = session.payment_intent`
  - `status = 'pending'` (ready for review)
- Logs: `event.type`, `event.id`, `listingId`

##### `payment_intent.succeeded`
- Looks up listing by `stripe_payment_intent_id`
- Sets `stripe_charge_id = payment_intent.latest_charge`
- Used for easier refund mapping

##### `charge.refunded`
- Looks up listing by `stripe_payment_intent_id` OR `stripe_charge_id`
- Sets `payment_status = 'refunded'`

### Fee Calculation

**Location**: `src/features/events/server/fee-calculator.ts`

**Function**: `calculateListingFee(params)`

**Supported Listing Types**:
- **Class/Workshop**: Base fee ($25 established, $35 emerging) + $5 per additional class
- **Performance**: Base fee ($25 established, $35 emerging)
- **Audition**: Base fee ($25 established, $35 emerging)
- **Creative**: Base fee ($25 established, $35 emerging)

**Returns**: `{ amount: number, currency: string } | null`
- Amount is in **cents**
- Returns `null` if `listing_fee_option !== 'PAY_FEE'`

### Client-Side Flow

1. **Form Submission** (`EventWizard.tsx`):
   - Submits listing via `/api/events`
   - If response includes `payment_required: true`:
     - Calls `/api/stripe/create-checkout-session` with `listingId`
     - Redirects to `session.url`

2. **Payment Success Page** (`/forms/payment-success`):
   - Extracts `listing_id` from URL
   - Polls `/api/events/{listingId}` checking `payment_status === 'paid'`
   - **Does NOT** call Stripe API directly (webhook is source of truth)
   - Redirects to calendar once confirmed

3. **Payment Cancel Page** (`/forms/payment-cancel`):
   - Shows "Payment canceled" message
   - "Try again" button creates new checkout session
   - Link to return to calendar

## Design Decisions

### Why Stripe Checkout (Not Custom Payment Form)?

- **Security**: PCI compliance handled by Stripe
- **UX**: Prebuilt, optimized payment experience
- **Maintenance**: Less code to maintain
- **Mobile**: Responsive and mobile-optimized

### Why Webhook-Based Status Updates?

- **Reliability**: Webhooks are Stripe's source of truth
- **Security**: Server-to-server communication
- **Idempotency**: Can safely retry webhook processing
- **Real-time**: Updates happen automatically

### Why Metadata-Based Entity Linking?

- **Extensibility**: Same webhook handler can process different entity types
- **Flexibility**: Can add donations, sponsorships, etc. without changing core logic
- **Audit Trail**: Metadata stored in Stripe for debugging

### Why Separate Payment Status from Listing Status?

- **Clarity**: Payment workflow separate from review workflow
- **Flexibility**: Can handle edge cases (e.g., refunded but still approved)
- **Admin UX**: Easy to filter by payment status

### Why Store Multiple Stripe IDs?

- `stripe_checkout_session_id`: Created when session is created
- `stripe_payment_intent_id`: Source of truth from webhook
- `stripe_charge_id`: Makes refund mapping easier

## Adding Other Payment Types

The system is designed to support multiple payment types (donations, sponsorships, etc.) through the metadata-based architecture.

### Step 1: Add Database Fields

For a new payment type (e.g., donations), create a new table or add fields to an existing table:

```sql
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount INTEGER NOT NULL,  -- in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  payment_status payment_status NOT NULL DEFAULT 'requires_payment',
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  donor_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### Step 2: Create Checkout Session API

Create a new route (e.g., `/api/stripe/create-donation-session/route.ts`):

```typescript
import Stripe from "stripe"
import { getServerEnv } from "@/lib/env"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth-helpers"

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedUser()
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { donationId, amount } = body // amount from client is OK for donations

  const supabase = await getSupabaseServerClient()
  const env = getServerEnv()
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-12-18.acacia",
  })

  // Verify donation exists and user has access
  const donation = await supabase
    .from("donations")
    .select("*")
    .eq("id", donationId)
    .single()

  if (donation.error || !donation.data) {
    return NextResponse.json({ error: "Donation not found" }, { status: 404 })
  }

  // Create checkout session with entity_type = "donation"
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Donation",
          },
          unit_amount: amount, // in cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${req.nextUrl.origin}/donations/success?session_id={CHECKOUT_SESSION_ID}&donation_id=${donationId}`,
    cancel_url: `${req.nextUrl.origin}/donations/cancel?donation_id=${donationId}`,
    metadata: {
      entity_type: "donation",  // ← Key difference
      entity_id: donationId,
      donor_id: auth.id,
    },
  })

  // Update donation with session ID
  await supabase
    .from("donations")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", donationId)

  return NextResponse.json({ url: session.url })
}
```

### Step 3: Update Webhook Handler

Add handling for the new entity type in `/api/stripe/webhook/route.ts`:

```typescript
case "checkout.session.completed": {
  const session = event.data.object as Stripe.Checkout.Session

  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const entityType = session.metadata?.entity_type
  const entityId = session.metadata?.entity_id

  if (!entityType || !entityId) {
    console.error("No entity_type or entity_id in session metadata")
    return NextResponse.json({ received: true }, { status: 200 })
  }

  // Handle different entity types
  if (entityType === "listing") {
    // Existing listing logic...
  } else if (entityType === "donation") {
    // New donation logic
    const donation = await supabase
      .from("donations")
      .select("id, payment_status")
      .eq("id", entityId)
      .single()

    if (donation.error || !donation.data) {
      console.error(`Donation ${entityId} not found`)
      return NextResponse.json({ received: true }, { status: 200 })
    }

    if (donation.data.payment_status === "paid") {
      console.log(`Donation ${entityId} already marked as paid`)
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const paymentIntentId = typeof session.payment_intent === "string" 
      ? session.payment_intent 
      : null

    await supabase
      .from("donations")
      .update({
        payment_status: "paid",
        stripe_payment_intent_id: paymentIntentId,
      })
      .eq("id", entityId)

    console.log(`Updated donation ${entityId} to paid`)
  }

  break
}
```

### Step 4: Create Success/Cancel Pages

Create pages similar to listing payment pages:
- `/donations/success/page.tsx`
- `/donations/cancel/page.tsx`

### Key Points for Adding New Payment Types

1. **Use `entity_type` in metadata** to distinguish payment types
2. **Use `entity_id` in metadata** to link back to your database record
3. **Follow the same webhook processing order** (signature → idempotency → insert → process)
4. **Store Stripe IDs** (`stripe_payment_intent_id`, `stripe_charge_id`) for refunds
5. **Use service role client** for webhook database writes (bypasses RLS)

## Refunds and Other Operations

### Refunds

Refunds are handled automatically via the `charge.refunded` webhook event. The webhook handler:

1. Receives `charge.refunded` event
2. Looks up listing by `stripe_payment_intent_id` or `stripe_charge_id`
3. Updates `payment_status = 'refunded'`

#### Manual Refunds via Stripe Dashboard

1. Go to Stripe Dashboard → Payments
2. Find the payment by `stripe_payment_intent_id` or `stripe_charge_id`
3. Click "Refund"
4. Webhook will automatically update `payment_status = 'refunded'`

#### Programmatic Refunds (Future Enhancement)

To add programmatic refunds, create an API route:

```typescript
// /api/stripe/refund/route.ts
import Stripe from "stripe"
import { getServerEnv } from "@/lib/env"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth-helpers"

export async function POST(req: NextRequest) {
  // Require admin role
  const auth = await requireRole("ADMIN")
  
  const body = await req.json()
  const { listingId, amount, reason } = body // amount is optional (full refund if not provided)

  const supabase = await getSupabaseServerClient()
  const env = getServerEnv()
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-12-18.acacia",
  })

  // Fetch listing
  const listing = await supabase
    .from("listings")
    .select("stripe_payment_intent_id, stripe_charge_id, payment_amount, payment_status")
    .eq("id", listingId)
    .single()

  if (listing.error || !listing.data) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 })
  }

  if (listing.data.payment_status !== "paid") {
    return NextResponse.json(
      { error: "Listing is not paid" },
      { status: 400 }
    )
  }

  // Get charge ID
  const chargeId = listing.data.stripe_charge_id
  if (!chargeId) {
    return NextResponse.json(
      { error: "Charge ID not found" },
      { status: 400 }
    )
  }

  // Create refund
  const refund = await stripe.refunds.create({
    charge: chargeId,
    amount: amount || undefined, // Full refund if not specified
    reason: reason || "requested_by_customer",
    metadata: {
      listing_id: listingId,
      refunded_by: auth.id,
    },
  })

  // Note: Webhook will update payment_status automatically
  // But you can also update immediately for better UX:
  await supabase
    .from("listings")
    .update({ payment_status: "refunded" })
    .eq("id", listingId)

  return NextResponse.json({ 
    refund_id: refund.id,
    amount: refund.amount,
    status: refund.status,
  })
}
```

### Other Operations

#### Check Payment Status

```typescript
// Query listing with payment fields
const listing = await supabase
  .from("listings")
  .select("payment_status, payment_amount, stripe_payment_intent_id")
  .eq("id", listingId)
  .single()
```

#### List Unpaid Listings

```typescript
const unpaid = await supabase
  .from("listings")
  .select("*")
  .eq("payment_status", "requires_payment")
  .eq("payment_required", true)
```

#### Cancel Payment Session

If a user needs to cancel before paying, you can expire the session:

```typescript
// Note: This requires storing the session ID
await stripe.checkout.sessions.expire(sessionId)

// Update listing
await supabase
  .from("listings")
  .update({ payment_status: "canceled" })
  .eq("id", listingId)
```

#### View Payment History

Query `stripe_webhook_events` table:

```typescript
const events = await supabase
  .from("stripe_webhook_events")
  .select("*")
  .eq("listing_id", listingId)
  .order("created_at", { ascending: false })
```

## Testing

### Test Mode Setup

1. Get test API keys from Stripe Dashboard
2. Set environment variables:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. Use Stripe CLI to forward webhooks locally:
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```

### Test Cards

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

### Testing Checklist

- [ ] Create listing with `PAY_FEE` option
- [ ] Verify `payment_status = 'requires_payment'`
- [ ] Create checkout session
- [ ] Complete payment with test card
- [ ] Verify webhook updates `payment_status = 'paid'`
- [ ] Verify listing status changes to `pending`
- [ ] Test payment cancel flow
- [ ] Test retry after cancel
- [ ] Test refund webhook
- [ ] Test idempotency (duplicate webhook events)

## Troubleshooting

### Webhook Not Receiving Events

1. **Check webhook endpoint URL** in Stripe Dashboard
2. **Verify webhook secret** matches `STRIPE_WEBHOOK_SECRET`
3. **Check webhook signature verification** in logs
4. **Use Stripe CLI** to test locally: `stripe trigger checkout.session.completed`

### Payment Status Not Updating

1. **Check webhook logs** in Stripe Dashboard
2. **Verify event is in `stripe_webhook_events` table**
3. **Check application logs** for errors
4. **Verify service role client** is used (bypasses RLS)

### Duplicate Payments

1. **Check idempotency** in `stripe_webhook_events` table
2. **Verify `already_paid` check** in checkout session creation
3. **Check for duplicate webhook deliveries** (should be handled by idempotency)

### Refund Not Processing

1. **Verify `stripe_charge_id` is set** (from `payment_intent.succeeded` event)
2. **Check webhook is receiving `charge.refunded` events**
3. **Verify refund was created in Stripe Dashboard**

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Missing stripe-signature header` | Webhook not from Stripe | Verify webhook URL |
| `Webhook signature verification failed` | Wrong webhook secret | Check `STRIPE_WEBHOOK_SECRET` |
| `Listing not found` | Entity ID mismatch | Check metadata in Stripe Dashboard |
| `Event already processed` | Duplicate webhook | Normal (idempotency working) |

## Security Best Practices

1. **Never trust client for amounts** - Always look up from database
2. **Verify webhook signatures** - Always verify Stripe signature
3. **Use service role client** - For webhook database writes (bypasses RLS)
4. **Check ownership** - Verify user owns entity before creating session
5. **Idempotency** - Always check if event already processed
6. **Logging** - Log all webhook events for debugging
7. **Environment variables** - Never commit Stripe keys to git

## Environment Variables

```bash
# Required
STRIPE_SECRET_KEY=sk_test_...          # or sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...        # From Stripe Dashboard → Webhooks

# Optional (for testing)
STRIPE_PUBLISHABLE_KEY=pk_test_...     # Not currently used (Checkout handles this)
```

## Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Refunds](https://stripe.com/docs/refunds)
