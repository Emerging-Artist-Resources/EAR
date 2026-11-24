-- Disposable webhook-retry fixture.
--
-- Matches the production column types, nullability, defaults, and checks for
-- listings, donations, and stripe_webhook_events that the webhook reads or
-- writes. The claim columns are not created here; the test applies
-- supabase/migrations/20261119180000_stripe_webhook_event_claims.sql afterward.
--
-- Included from production besides those columns:
-- - payment_status, listing_status, listing_type, and donation_stripe_account enums
-- - listings/donations check constraints
-- - stripe_webhook_events primary key and foreign keys (ON DELETE SET NULL)
-- - Stripe id indexes, including the partial unique index on donation checkout session id
-- - listings.updated_at trigger
--
-- Omitted, because the webhook service role does not depend on them and they
-- require auth/storage objects that are not part of this fixture:
-- - profiles, auth.users, and foreign keys from created_by, reviewed_by,
--   donor_id, and recipient_user_id
-- - listing child tables (details, photos, occurrences, relationships)
-- - production RLS policies and role grants. RLS stays disabled. Supabase's
--   service_role bypasses RLS; this role has no BYPASSRLS, so the effect matches
--   only while RLS is off. One test enables RLS with its own SELECT policy as a
--   lock barrier, then drops that policy.
-- - anon/authenticated insert checks (for example donation amount >= 100)
-- - non-Stripe listing/donation indexes
-- - storage, auth, and other application tables
--
-- test_barrier, test_gate, and test_failures are test-only. They are not part
-- of the production schema. Advisory-lock barriers order concurrent claims and
-- the checkout/refund overlap. They do not sleep.

CREATE SCHEMA IF NOT EXISTS extensions;

CREATE EXTENSION IF NOT EXISTS dblink SCHEMA extensions;

CREATE TYPE public.donation_stripe_account AS ENUM ('ear', 'sponsor');

CREATE TYPE public.listing_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'draft',
  'pending_payment'
);

CREATE TYPE public.listing_type AS ENUM (
  'audition',
  'creative',
  'performance',
  'class'
);

CREATE TYPE public.payment_status AS ENUM (
  'not_required',
  'requires_payment',
  'paid',
  'refunded',
  'canceled'
);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE public.listings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  type public.listing_type NOT NULL,
  status public.listing_status DEFAULT 'pending' NOT NULL,
  contact_name text NOT NULL,
  pronouns text,
  contact_email text NOT NULL,
  company text,
  company_website text,
  address text,
  place_id text,
  lat numeric(10, 8),
  lng numeric(11, 8),
  venue_name text,
  location_instructions text,
  social_handles text,
  notes text,
  meta jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  submitted_at timestamptz DEFAULT now() NOT NULL,
  reviewed_at timestamptz,
  reviewed_by uuid,
  deleted_at timestamptz,
  payment_required boolean DEFAULT false NOT NULL,
  payment_amount integer,
  payment_currency text DEFAULT 'usd' NOT NULL,
  payment_status public.payment_status DEFAULT 'not_required' NOT NULL,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  resubmitted_at timestamptz,
  CONSTRAINT listings_pkey PRIMARY KEY (id),
  CONSTRAINT listings_payment_amount_nonneg CHECK (payment_amount IS NULL OR payment_amount >= 0),
  CONSTRAINT listings_payment_currency_lowercase CHECK (payment_currency = lower(payment_currency)),
  CONSTRAINT listings_payment_required_amount_consistency CHECK (
    (payment_required = true AND payment_amount IS NOT NULL) OR payment_required = false
  )
);

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.donations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  amount integer NOT NULL,
  currency text DEFAULT 'usd' NOT NULL,
  payment_status public.payment_status DEFAULT 'requires_payment' NOT NULL,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  donor_id uuid,
  donor_name text,
  donor_email text,
  message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  recipient_user_id uuid,
  recipient_name text,
  cover_card_fee boolean DEFAULT false NOT NULL,
  cover_fiscal_fee boolean DEFAULT false NOT NULL,
  donor_receipt_sent_at timestamptz,
  internal_notification_sent_at timestamptz,
  base_gift_cents integer NOT NULL,
  fee_model_version smallint DEFAULT 1 NOT NULL,
  stripe_account public.donation_stripe_account NOT NULL,
  designation_option_id text,
  designation_label_snapshot text,
  CONSTRAINT donations_pkey PRIMARY KEY (id),
  CONSTRAINT donations_amount_positive CHECK (amount > 0),
  CONSTRAINT donations_currency_lowercase CHECK (currency = lower(currency))
);

CREATE UNIQUE INDEX idx_donations_stripe_checkout_session_id_unique
  ON public.donations (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

CREATE INDEX idx_donations_stripe_charge_id
  ON public.donations (stripe_charge_id)
  WHERE stripe_charge_id IS NOT NULL;

CREATE INDEX idx_donations_stripe_payment_intent_id
  ON public.donations (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX idx_listings_stripe_charge_id
  ON public.listings (stripe_charge_id)
  WHERE stripe_charge_id IS NOT NULL;

CREATE INDEX idx_listings_stripe_payment_intent_id
  ON public.listings (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE TABLE public.stripe_webhook_events (
  id text NOT NULL,
  type text NOT NULL,
  listing_id uuid,
  stripe_created timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  donation_id uuid,
  CONSTRAINT stripe_webhook_events_pkey PRIMARY KEY (id),
  CONSTRAINT stripe_webhook_events_listing_id_fkey
    FOREIGN KEY (listing_id) REFERENCES public.listings (id) ON DELETE SET NULL,
  CONSTRAINT stripe_webhook_events_donation_id_fkey
    FOREIGN KEY (donation_id) REFERENCES public.donations (id) ON DELETE SET NULL
);

CREATE INDEX idx_stripe_webhook_events_created_at
  ON public.stripe_webhook_events (created_at DESC);

CREATE INDEX idx_stripe_webhook_events_donation_id
  ON public.stripe_webhook_events (donation_id)
  WHERE donation_id IS NOT NULL;

CREATE INDEX idx_stripe_webhook_events_listing_id
  ON public.stripe_webhook_events (listing_id)
  WHERE listing_id IS NOT NULL;

CREATE INDEX idx_stripe_webhook_events_type
  ON public.stripe_webhook_events (type);

CREATE TABLE public.test_barrier (
  id integer PRIMARY KEY,
  goal integer NOT NULL,
  arrived integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT false
);

INSERT INTO public.test_barrier (id, goal, arrived, active) VALUES (1, 2, 0, false);

CREATE TABLE public.test_gate (
  name text PRIMARY KEY,
  armed boolean NOT NULL DEFAULT false
);

INSERT INTO public.test_gate (name, armed) VALUES ('listing_read', false);

CREATE TABLE public.test_failures (
  name text PRIMARY KEY,
  remaining integer NOT NULL
);

CREATE OR REPLACE FUNCTION public.listing_read_gate(row_id uuid) RETURNS boolean
LANGUAGE plpgsql
VOLATILE
AS $$
BEGIN
  IF row_id IS NULL THEN
    RETURN true;
  END IF;

  IF COALESCE((SELECT armed FROM public.test_gate WHERE name = 'listing_read'), false) THEN
    -- Block until the test releases the exclusive lock. Shared waiters are
    -- released together; this gate expects one checkout read.
    PERFORM pg_advisory_lock_shared(91, 2);
    PERFORM pg_advisory_unlock_shared(91, 2);
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.stripe_webhook_events_claim_barrier() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.test_barrier WHERE id = 1 AND active) THEN
    PERFORM pg_advisory_lock_shared(91, 1);
    PERFORM pg_advisory_unlock_shared(91, 1);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER stripe_webhook_events_claim_barrier
  BEFORE INSERT ON public.stripe_webhook_events
  FOR EACH ROW EXECUTE FUNCTION public.stripe_webhook_events_claim_barrier();

-- Decrements an armed failure counter in a separate transaction so a forced
-- error still consumes the counter when the webhook statement rolls back.
CREATE OR REPLACE FUNCTION public.fail_armed_write() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  failure_name text;
  remaining_count integer;
  executed text;
BEGIN
  IF TG_TABLE_NAME = 'listings' THEN
    IF NEW.payment_status IS DISTINCT FROM 'paid'::public.payment_status
       OR OLD.payment_status = 'paid'::public.payment_status THEN
      RETURN NEW;
    END IF;
    failure_name := 'listing_paid';
  ELSIF TG_TABLE_NAME = 'stripe_webhook_events' THEN
    IF NEW.status IS DISTINCT FROM 'completed' OR OLD.status = 'completed' THEN
      RETURN NEW;
    END IF;
    failure_name := 'event_completed';
  ELSE
    RETURN NEW;
  END IF;

  SELECT remaining INTO remaining_count
  FROM public.test_failures
  WHERE name = failure_name;

  IF COALESCE(remaining_count, 0) <= 0 THEN
    RETURN NEW;
  END IF;

  executed := extensions.dblink_exec(
    'dbname=' || current_database() || ' user=postgres',
    format(
      'UPDATE public.test_failures SET remaining = remaining - 1 WHERE name = %L AND remaining > 0',
      failure_name
    )
  );

  IF executed = 'UPDATE 1' THEN
    RAISE EXCEPTION 'forced % failure', failure_name;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER zz_fail_armed_listing_write
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.fail_armed_write();

CREATE TRIGGER zz_fail_armed_event_write
  BEFORE UPDATE ON public.stripe_webhook_events
  FOR EACH ROW EXECUTE FUNCTION public.fail_armed_write();

CREATE OR REPLACE FUNCTION public.wait_for_advisory_waiters(
  expected_classid integer,
  expected_objid integer,
  goal integer
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  seen integer := 0;
  spins integer := 0;
  conn text := 'dbname=' || current_database() || ' user=postgres';
BEGIN
  BEGIN
    PERFORM extensions.dblink_disconnect('barrier_wait');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  PERFORM extensions.dblink_connect('barrier_wait', conn);
  LOOP
    SELECT t.n INTO seen
    FROM extensions.dblink(
      'barrier_wait',
      format(
        'SELECT count(*)::int FROM pg_locks WHERE locktype = ''advisory'' AND classid = %s AND objid = %s AND mode = ''ShareLock'' AND NOT granted AND database = (SELECT oid FROM pg_database WHERE datname = current_database())',
        expected_classid,
        expected_objid
      )
    ) AS t(n integer);

    EXIT WHEN COALESCE(seen, 0) >= goal;

    spins := spins + 1;
    IF spins > 20000 THEN
      PERFORM extensions.dblink_disconnect('barrier_wait');
      RAISE EXCEPTION
        'barrier timed out waiting for % ShareLock waiters on (%, %), last saw %',
        goal, expected_classid, expected_objid, seen;
    END IF;
  END LOOP;

  PERFORM extensions.dblink_disconnect('barrier_wait');
EXCEPTION
  WHEN OTHERS THEN
    BEGIN
      PERFORM extensions.dblink_disconnect('barrier_wait');
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.listing_read_gate(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.stripe_webhook_events_claim_barrier() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fail_armed_write() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.wait_for_advisory_waiters(integer, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
