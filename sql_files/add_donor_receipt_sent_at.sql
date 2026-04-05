-- ============================================================================
-- Donations: track when donor receipt email was sent (idempotency / retries)
-- ============================================================================

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS donor_receipt_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN donations.donor_receipt_sent_at IS
  'When Postmark donor receipt was claimed/sent; null if not yet sent or rolled back after failure';
