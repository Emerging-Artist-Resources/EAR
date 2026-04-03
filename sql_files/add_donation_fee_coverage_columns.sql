-- ============================================================================
-- Add fee coverage flags for artist donations
-- ============================================================================

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS cover_card_fee BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cover_fiscal_fee BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN donations.cover_card_fee IS 'True when donor opts to cover 3% card processing fee';
COMMENT ON COLUMN donations.cover_fiscal_fee IS 'True when donor opts to cover 5.5% fiscal sponsorship fee';
