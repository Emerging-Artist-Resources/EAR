-- ============================================================================
-- CREATE DONATIONS TABLE
-- /Users/kaylalaufer/Documents/EAR/performance-calendar/sql_files/create_donations_table.sql
-- ============================================================================
-- This migration adds:
-- 1. donations table for donation records
-- 2. donation_id column to stripe_webhook_events table
-- ============================================================================
-- Note: payment_status enum already exists from add_payment_fields_to_listings.sql
-- ============================================================================

-- ============================================================================
-- 1. CREATE donations TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  payment_status payment_status NOT NULL DEFAULT 'requires_payment',
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  donor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  donor_name TEXT,
  donor_email TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 2. ADD SANITY CONSTRAINTS (idempotent)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'donations_amount_positive'
  ) THEN
    ALTER TABLE donations
      ADD CONSTRAINT donations_amount_positive
      CHECK (amount > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'donations_currency_lowercase'
  ) THEN
    ALTER TABLE donations
      ADD CONSTRAINT donations_currency_lowercase
      CHECK (currency = lower(currency));
  END IF;
END $$;

-- ============================================================================
-- 3. ADD INDEXES FOR COMMON QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id) WHERE donor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_donations_payment_status ON donations(payment_status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_stripe_payment_intent_id ON donations(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_donations_stripe_charge_id ON donations(stripe_charge_id) WHERE stripe_charge_id IS NOT NULL;

-- ============================================================================
-- 4. UPDATE stripe_webhook_events TABLE TO SUPPORT DONATIONS
-- ============================================================================

ALTER TABLE stripe_webhook_events
  ADD COLUMN IF NOT EXISTS donation_id UUID REFERENCES donations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_donation_id ON stripe_webhook_events(donation_id) WHERE donation_id IS NOT NULL;

-- ============================================================================
-- 5. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE donations IS 'Donation records with payment tracking via Stripe';
COMMENT ON COLUMN donations.id IS 'Unique donation identifier';
COMMENT ON COLUMN donations.amount IS 'Donation amount in cents';
COMMENT ON COLUMN donations.currency IS 'Donation currency (default: usd, must be lowercase)';
COMMENT ON COLUMN donations.payment_status IS 'Current payment status: not_required, requires_payment, paid, refunded, or canceled';
COMMENT ON COLUMN donations.stripe_checkout_session_id IS 'Stripe Checkout session ID (set when creating session)';
COMMENT ON COLUMN donations.stripe_payment_intent_id IS 'Stripe Payment Intent ID (set from webhook, source of truth)';
COMMENT ON COLUMN donations.stripe_charge_id IS 'Stripe Charge ID (set from payment_intent.succeeded webhook for easier refund mapping)';
COMMENT ON COLUMN donations.donor_id IS 'Profile ID of authenticated donor (nullable for anonymous donations)';
COMMENT ON COLUMN donations.donor_name IS 'Donor name (optional, may be provided for anonymous donations)';
COMMENT ON COLUMN donations.donor_email IS 'Donor email — required for new donations at the app layer (receipts/Stripe); column nullable for legacy rows';
COMMENT ON COLUMN donations.message IS 'Optional message from donor';
COMMENT ON COLUMN donations.created_at IS 'Timestamp when donation record was created';

COMMENT ON COLUMN stripe_webhook_events.donation_id IS 'Associated donation ID if applicable (nullable - set when available, may be null if donation cannot be determined)';
