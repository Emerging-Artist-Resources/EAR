-- ============================================================================
-- RLS: donations + stripe_webhook_events
-- ============================================================================
-- - stripe_webhook_events: RLS enabled, no policies for anon/authenticated
--   (service role bypasses RLS for webhooks).
-- - donations: INSERT shells for anon + authenticated; SELECT for donor/recipient/admin;
--   no UPDATE/DELETE for end users (payment truth via service role + Stripe).
-- - public.is_admin(): created only if missing (listings may already define it).
-- ============================================================================

-- -----------------------------------------------------------------------------
-- 1) stripe_webhook_events — backend-only
-- -----------------------------------------------------------------------------
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2) public.is_admin() — align with profiles.role / authz (skip body if exists)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'is_admin'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    CREATE FUNCTION public.is_admin()
    RETURNS boolean
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $fn$
      SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'
      );
    $fn$;
  END IF;
END $$;

-- Ensure grants match donations RLS design (authenticated only; anon does not call is_admin)
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

-- -----------------------------------------------------------------------------
-- 3) donations
-- -----------------------------------------------------------------------------
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- INSERT — anon (pending shell; amount may differ from base_gift_cents for artist gross-up)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'donations'
      AND policyname = 'donations_insert_anon'
  ) THEN
    CREATE POLICY donations_insert_anon
      ON public.donations
      FOR INSERT
      TO anon
      WITH CHECK (
        donor_id IS NULL
        AND payment_status = 'requires_payment'::public.payment_status
        AND stripe_checkout_session_id IS NULL
        AND stripe_payment_intent_id IS NULL
        AND stripe_charge_id IS NULL
        AND internal_notification_sent_at IS NULL
        AND donor_receipt_sent_at IS NULL
        AND currency = 'usd'
        AND amount >= 100
        AND amount <= 10000000
        AND base_gift_cents >= 100
        AND base_gift_cents <= 10000000
      );
  END IF;
END $$;

-- INSERT — authenticated
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'donations'
      AND policyname = 'donations_insert_authenticated'
  ) THEN
    CREATE POLICY donations_insert_authenticated
      ON public.donations
      FOR INSERT
      TO authenticated
      WITH CHECK (
        donor_id = auth.uid()
        AND payment_status = 'requires_payment'::public.payment_status
        AND stripe_checkout_session_id IS NULL
        AND stripe_payment_intent_id IS NULL
        AND stripe_charge_id IS NULL
        AND internal_notification_sent_at IS NULL
        AND donor_receipt_sent_at IS NULL
        AND currency = 'usd'
        AND amount >= 100
        AND amount <= 10000000
        AND base_gift_cents >= 100
        AND base_gift_cents <= 10000000
      );
  END IF;
END $$;

-- SELECT — authenticated (donor, recipient, admin)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'donations'
      AND policyname = 'donations_select_authenticated'
  ) THEN
    CREATE POLICY donations_select_authenticated
      ON public.donations
      FOR SELECT
      TO authenticated
      USING (
        donor_id = auth.uid()
        OR recipient_user_id = auth.uid()
        OR public.is_admin()
      );
  END IF;
END $$;
