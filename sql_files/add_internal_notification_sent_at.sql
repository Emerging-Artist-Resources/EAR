-- ============================================================================
-- Donations: track when internal artist/admin Postmark+PDF was sent
-- ============================================================================

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS internal_notification_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN donations.internal_notification_sent_at IS
  'When internal artist/admin Postmark template+PDF was claimed/sent; null if not sent';
