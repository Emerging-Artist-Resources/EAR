-- ============================================================================
-- donations.stripe_account: which Stripe account processes the payment (EAR vs sponsor)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'donation_stripe_account') THEN
    CREATE TYPE donation_stripe_account AS ENUM ('ear', 'sponsor');
  END IF;
END $$;

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS stripe_account donation_stripe_account;

UPDATE donations
SET stripe_account = CASE
  WHEN recipient_user_id IS NOT NULL THEN 'sponsor'::donation_stripe_account
  ELSE 'ear'::donation_stripe_account
END
WHERE stripe_account IS NULL;

ALTER TABLE donations
  ALTER COLUMN stripe_account SET NOT NULL;

COMMENT ON COLUMN donations.stripe_account IS
  'ear = EAR Stripe account (generic donations); sponsor = fiscal sponsor Stripe account (artist donations)';
