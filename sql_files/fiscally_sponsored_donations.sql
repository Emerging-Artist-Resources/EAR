-- ============================================================================
-- Fiscally sponsored donations: profiles.slug, donations recipient columns,
-- unique Stripe checkout session id, optional public read policy for donate pages
-- ============================================================================

-- -----------------------------------------------------------------------------
-- 1. profiles.slug (nullable until backfill; unique when set)
-- -----------------------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_slug_unique
  ON profiles (slug)
  WHERE slug IS NOT NULL;

COMMENT ON COLUMN profiles.slug IS 'Public URL slug for /donate/[slug]; write-once after first set';

-- -----------------------------------------------------------------------------
-- 2. Deterministic slug backfill (name-based + numeric suffix on collision)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION _profile_slug_base(p_name TEXT, p_id UUID)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(
    trim(both '-' FROM regexp_replace(
      lower(regexp_replace(trim(COALESCE(p_name, '')), '[^a-zA-Z0-9]+', '-', 'g')),
      '-+', '-', 'g'
    )),
    ''
  );
$$;

UPDATE profiles p
SET slug = computed.final_slug
FROM (
  SELECT
    id,
    CASE
      WHEN row_num = 1 THEN base
      ELSE base || '-' || (row_num - 1)::TEXT
    END AS final_slug
  FROM (
    SELECT
      id,
      LEFT(
        CASE
          WHEN slug_base IS NULL OR slug_base = '' THEN 'user-' || SUBSTRING(REPLACE(id::TEXT, '-', '') FROM 1 FOR 12)
          ELSE slug_base
        END,
        80
      ) AS base,
      ROW_NUMBER() OVER (
        PARTITION BY
          LEFT(
            CASE
              WHEN slug_base IS NULL OR slug_base = '' THEN 'user-' || SUBSTRING(REPLACE(id::TEXT, '-', '') FROM 1 FOR 12)
              ELSE slug_base
            END,
            80
          )
        ORDER BY created_at NULLS LAST, id
      ) AS row_num
    FROM (
      SELECT
        id,
        name,
        created_at,
        _profile_slug_base(name, id) AS slug_base
      FROM profiles
      WHERE slug IS NULL
    ) s
  ) numbered
) AS computed
WHERE p.id = computed.id
  AND p.slug IS NULL;

DROP FUNCTION IF EXISTS _profile_slug_base(TEXT, UUID);

-- -----------------------------------------------------------------------------
-- 3. donations: recipient + reporting index + unique checkout session id
-- -----------------------------------------------------------------------------
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS recipient_user_id UUID REFERENCES profiles (id) ON DELETE SET NULL;

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS recipient_name TEXT;

CREATE INDEX IF NOT EXISTS idx_donations_recipient_user_id
  ON donations (recipient_user_id)
  WHERE recipient_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_donations_recipient_user_payment_status
  ON donations (recipient_user_id, payment_status)
  WHERE recipient_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_donations_stripe_checkout_session_id_unique
  ON donations (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

COMMENT ON COLUMN donations.recipient_user_id IS 'Artist/recipient profile for fiscally sponsored donation (canonical)';
COMMENT ON COLUMN donations.recipient_name IS 'Optional display snapshot at donation time';

-- -----------------------------------------------------------------------------
-- 4. RLS: allow unauthenticated read of profiles that have a public slug (donate pages)
--    Skip if your project already defines equivalent policy (may error on duplicate name).
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_select_public_slug'
  ) THEN
    CREATE POLICY profiles_select_public_slug
      ON profiles
      FOR SELECT
      USING (slug IS NOT NULL);
  END IF;
END $$;
