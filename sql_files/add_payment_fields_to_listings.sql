-- ============================================================================
-- ADD PAYMENT FIELDS TO LISTINGS
-- /Users/kaylalaufer/Documents/EAR/performance-calendar/sql_files/add_payment_fields_to_listings.sql
-- ============================================================================
-- This migration adds:
-- 1. Payment status enum (idempotent)
-- 2. Payment fields to listings table
-- 3. stripe_webhook_events table for event idempotency
-- ============================================================================
-- Note: The pending_payment status addition to listing_status enum is in
-- a separate migration file to avoid transaction issues.
-- ============================================================================

-- ============================================================================
-- 1. CREATE PAYMENT STATUS ENUM (idempotent)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM (
      'not_required',
      'requires_payment',
      'paid',
      'refunded',
      'canceled'
    );
  END IF;
END $$;

-- ============================================================================
-- 2. ADD PAYMENT FIELDS TO listings TABLE
-- ============================================================================

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS payment_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_amount INTEGER,
  ADD COLUMN IF NOT EXISTS payment_currency TEXT NOT NULL DEFAULT 'usd',
  ADD COLUMN IF NOT EXISTS payment_status payment_status NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT;

-- ============================================================================
-- 3. ADD SANITY CONSTRAINTS (idempotent)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'listings_payment_amount_nonneg'
  ) THEN
    ALTER TABLE listings
      ADD CONSTRAINT listings_payment_amount_nonneg
      CHECK (payment_amount IS NULL OR payment_amount >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'listings_payment_currency_lowercase'
  ) THEN
    ALTER TABLE listings
      ADD CONSTRAINT listings_payment_currency_lowercase
      CHECK (payment_currency = lower(payment_currency));
  END IF;
END $$;

-- Optional safety constraint: ensures payment_required and payment_amount are consistent
-- Only enforces amount presence when payment is required (allows keeping computed amounts for analytics/audit)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'listings_payment_required_amount_consistency'
  ) THEN
    ALTER TABLE listings
      ADD CONSTRAINT listings_payment_required_amount_consistency
      CHECK (
        (payment_required = true AND payment_amount IS NOT NULL)
        OR
        (payment_required = false)
      );
  END IF;
END $$;

-- ============================================================================
-- 4. ADD INDEXES FOR COMMON QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_listings_payment_status ON listings(payment_status);
CREATE INDEX IF NOT EXISTS idx_listings_payment_required ON listings(payment_required) WHERE payment_required = true;
CREATE INDEX IF NOT EXISTS idx_listings_stripe_payment_intent_id ON listings(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_stripe_charge_id ON listings(stripe_charge_id) WHERE stripe_charge_id IS NOT NULL;

-- ============================================================================
-- 5. CREATE stripe_webhook_events TABLE FOR EVENT IDEMPOTENCY
-- ============================================================================

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id TEXT PRIMARY KEY, -- Stripe event ID
  type TEXT NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  stripe_created TIMESTAMPTZ, -- Stripe event created timestamp (for audit/debugging)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type ON stripe_webhook_events(type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_listing_id ON stripe_webhook_events(listing_id) WHERE listing_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_created_at ON stripe_webhook_events(created_at DESC);

-- ============================================================================
-- 6. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN listings.payment_required IS 'Whether payment is required for this listing';
COMMENT ON COLUMN listings.payment_amount IS 'Payment amount in cents (nullable if no payment required)';
COMMENT ON COLUMN listings.payment_currency IS 'Payment currency (default: usd, must be lowercase)';
COMMENT ON COLUMN listings.payment_status IS 'Current payment status: not_required, requires_payment, paid, refunded, or canceled';
COMMENT ON COLUMN listings.stripe_checkout_session_id IS 'Stripe Checkout session ID (set when creating session)';
COMMENT ON COLUMN listings.stripe_payment_intent_id IS 'Stripe Payment Intent ID (set from webhook, source of truth)';
COMMENT ON COLUMN listings.stripe_charge_id IS 'Stripe Charge ID (set from payment_intent.succeeded webhook for easier refund mapping)';

COMMENT ON TABLE stripe_webhook_events IS 'Tracks processed Stripe webhook events for idempotency. Event IDs are unique and prevent duplicate processing.';
COMMENT ON COLUMN stripe_webhook_events.id IS 'Stripe event ID (primary key for idempotency)';
COMMENT ON COLUMN stripe_webhook_events.type IS 'Stripe event type (e.g., checkout.session.completed)';
COMMENT ON COLUMN stripe_webhook_events.listing_id IS 'Associated listing ID if applicable (nullable - set when available, may be null if listing cannot be determined)';
COMMENT ON COLUMN stripe_webhook_events.stripe_created IS 'Stripe event created timestamp (for audit/debugging)';
