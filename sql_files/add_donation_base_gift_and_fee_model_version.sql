-- ============================================================================
-- Donations: base_gift_cents (intended gift) + fee_model_version (amount semantics)
-- Legacy rows: amount left unchanged (historically stored base gift before this migration).
-- New rows (fee_model_version = 2): amount = total charged (estimate pre-pay; Stripe webhook authoritative).
-- ============================================================================

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS base_gift_cents INTEGER;

UPDATE donations
SET base_gift_cents = amount
WHERE base_gift_cents IS NULL;

ALTER TABLE donations
  ALTER COLUMN base_gift_cents SET NOT NULL;

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS fee_model_version SMALLINT NOT NULL DEFAULT 1;

COMMENT ON COLUMN donations.base_gift_cents IS
  'Intended donation in cents (donor-entered gift amount)';
COMMENT ON COLUMN donations.amount IS
  'For fee_model_version 1: legacy semantics (historically base gift). For fee_model_version 2: total charged in cents (Stripe amount_total after payment; estimate from computeGrossChargeCents before pay)';
COMMENT ON COLUMN donations.fee_model_version IS
  '1 = legacy row (amount column may mean base gift only). 2 = amount is total charged / Stripe total';

COMMENT ON COLUMN donations.cover_card_fee IS
  'When true with sponsor Stripe: donor covers processing fees (2.9% + $0.30) via gross-up';
