-- ============================================================================
-- Optional hero copy + image for /donate/[slug] (profiles)
-- Image object path is relative to Storage bucket donation-page-photos (see runbook).
-- ============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS donation_page_message TEXT,
  ADD COLUMN IF NOT EXISTS donation_page_image_path TEXT;

COMMENT ON COLUMN profiles.donation_page_message IS 'Optional copy shown on /donate/[slug]; null uses default page copy only';
COMMENT ON COLUMN profiles.donation_page_image_path IS 'Object path in donation-page-photos bucket; null means no hero image';
