-- Integration coverage for legal_acceptances.
-- Run with: supabase test db
-- Does not change listing policies or listing mutation behavior.

BEGIN;

SELECT plan(34);

SELECT has_table('public', 'legal_acceptances', 'legal_acceptances exists');
SELECT col_is_pk('public', 'legal_acceptances', 'id', 'id is the primary key');

SELECT has_index(
  'public',
  'legal_acceptances',
  'idx_legal_acceptances_user_document_accepted_at',
  'user, document, and accepted_at index exists'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_legal_acceptances_user_document_accepted_at'
      AND indexdef ILIKE '%accepted_at DESC%'
  ),
  'user document index sorts accepted_at descending'
);

SELECT has_index(
  'public',
  'legal_acceptances',
  'idx_legal_acceptances_listing_id',
  'listing index exists'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_legal_acceptances_listing_id'
      AND indexdef ILIKE '%listing_id IS NOT NULL%'
  ),
  'listing index is partial'
);

SELECT set_eq(
  $$
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'legal_acceptances'
  $$,
  $$
    VALUES
      ('legal_acceptances_select_own'),
      ('legal_acceptances_select_admin')
  $$,
  'only owner and admin select policies exist'
);

SELECT ok(
  has_table_privilege('authenticated', 'public.legal_acceptances', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'public.legal_acceptances', 'INSERT')
  AND NOT has_table_privilege('authenticated', 'public.legal_acceptances', 'UPDATE')
  AND NOT has_table_privilege('authenticated', 'public.legal_acceptances', 'DELETE')
  AND NOT has_table_privilege('anon', 'public.legal_acceptances', 'SELECT')
  AND NOT has_table_privilege('anon', 'public.legal_acceptances', 'INSERT'),
  'authenticated can select and cannot write; anon has no access'
);

SELECT ok(
  has_table_privilege('service_role', 'public.legal_acceptances', 'SELECT')
  AND has_table_privilege('service_role', 'public.legal_acceptances', 'INSERT')
  AND NOT has_table_privilege('service_role', 'public.legal_acceptances', 'UPDATE')
  AND NOT has_table_privilege('service_role', 'public.legal_acceptances', 'DELETE')
  AND NOT has_table_privilege('service_role', 'public.legal_acceptances', 'TRUNCATE'),
  'service role can select and insert, and cannot update, delete, or truncate'
);

SELECT ok(
  NOT has_function_privilege('public', 'public.stamp_legal_acceptance_accepted_at()', 'EXECUTE')
  AND NOT has_function_privilege('anon', 'public.stamp_legal_acceptance_accepted_at()', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.stamp_legal_acceptance_accepted_at()', 'EXECUTE')
  AND has_function_privilege('service_role', 'public.stamp_legal_acceptance_accepted_at()', 'EXECUTE')
  AND NOT has_function_privilege('public', 'public.prevent_legal_acceptance_update()', 'EXECUTE')
  AND NOT has_function_privilege('anon', 'public.prevent_legal_acceptance_update()', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.prevent_legal_acceptance_update()', 'EXECUTE')
  AND has_function_privilege('service_role', 'public.prevent_legal_acceptance_update()', 'EXECUTE'),
  'trigger functions are executable by service role only'
);

SELECT is_empty(
  $$ SELECT 1 FROM public.legal_acceptances $$,
  'migration does not backfill acceptance rows'
);

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'legal-owner@example.com',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Legal Owner"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'legal-other@example.com',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Legal Other"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-4333-8333-333333333333',
    'authenticated',
    'authenticated',
    'legal-admin@example.com',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Legal Admin"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

UPDATE public.profiles
SET role = 'admin'
WHERE id = '33333333-3333-4333-8333-333333333333';

INSERT INTO public.listings (id, type, contact_name, contact_email, created_by)
VALUES (
  '44444444-4444-4444-8444-444444444444',
  'performance',
  'Legal Owner',
  'legal-owner@example.com',
  '11111111-1111-4111-8111-111111111111'
);

SET LOCAL ROLE service_role;

SELECT lives_ok(
  $$
    INSERT INTO public.legal_acceptances (user_id, document_key, document_version, accepted_at)
    VALUES (
      '11111111-1111-4111-8111-111111111111',
      'account_terms',
      '2026-11-23',
      '2000-01-01 00:00:00+00'
    )
  $$,
  'service role can insert an account acceptance'
);

SELECT lives_ok(
  $$
    INSERT INTO public.legal_acceptances (user_id, document_key, document_version)
    VALUES (
      '11111111-1111-4111-8111-111111111111',
      'privacy_policy',
      '2026-11-23'
    )
  $$,
  'service role can insert a privacy acceptance without a timestamp'
);

RESET ROLE;

SELECT cmp_ok(
  (
    SELECT accepted_at
    FROM public.legal_acceptances
    WHERE user_id = '11111111-1111-4111-8111-111111111111'
      AND document_key = 'account_terms'
  ),
  '>',
  timestamptz '2001-01-01 00:00:00+00',
  'a supplied accepted_at is overwritten'
);

INSERT INTO public.legal_acceptances (user_id, document_key, document_version)
VALUES (
  '22222222-2222-4222-8222-222222222222',
  'privacy_policy',
  '2026-11-23'
);

SELECT set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
SET LOCAL ROLE authenticated;

SELECT results_eq(
  $$
    SELECT document_key
    FROM public.legal_acceptances
    ORDER BY document_key
  $$,
  $$ VALUES ('account_terms'::text), ('privacy_policy'::text) $$,
  'a user selects only their own rows'
);

SELECT throws_ok(
  $$
    INSERT INTO public.legal_acceptances (user_id, document_key, document_version)
    VALUES ('11111111-1111-4111-8111-111111111111', 'account_terms', '2026-11-23')
  $$,
  '42501',
  NULL,
  'authenticated insert is denied'
);

SELECT throws_ok(
  $$
    UPDATE public.legal_acceptances
    SET document_version = 'changed'
    WHERE user_id = '11111111-1111-4111-8111-111111111111'
  $$,
  '42501',
  NULL,
  'authenticated update is denied'
);

SELECT throws_ok(
  $$
    DELETE FROM public.legal_acceptances
    WHERE user_id = '11111111-1111-4111-8111-111111111111'
  $$,
  '42501',
  NULL,
  'authenticated delete is denied'
);

RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
SET LOCAL ROLE authenticated;

SELECT results_eq(
  $$ SELECT user_id::text FROM public.legal_acceptances $$,
  $$ VALUES ('22222222-2222-4222-8222-222222222222') $$,
  'another user cannot select the first user rows'
);

RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',
  true
);
SET LOCAL ROLE authenticated;

SELECT results_eq(
  $$
    SELECT user_id::text, document_key
    FROM public.legal_acceptances
    ORDER BY user_id::text, document_key
  $$,
  $$
    VALUES
      ('11111111-1111-4111-8111-111111111111', 'account_terms'),
      ('11111111-1111-4111-8111-111111111111', 'privacy_policy'),
      ('22222222-2222-4222-8222-222222222222', 'privacy_policy')
  $$,
  'an admin selects every acceptance row'
);

RESET ROLE;
SET LOCAL ROLE anon;

SELECT throws_ok(
  $$ SELECT 1 FROM public.legal_acceptances $$,
  '42501',
  NULL,
  'anon cannot select acceptance rows'
);

RESET ROLE;
SET LOCAL ROLE service_role;

SELECT throws_ok(
  $$
    UPDATE public.legal_acceptances
    SET document_version = 'changed'
    WHERE user_id = '11111111-1111-4111-8111-111111111111'
      AND document_key = 'account_terms'
  $$,
  '42501',
  NULL,
  'service role update is denied'
);

SELECT throws_ok(
  $$
    DELETE FROM public.legal_acceptances
    WHERE user_id = '11111111-1111-4111-8111-111111111111'
  $$,
  '42501',
  NULL,
  'service role delete is denied'
);

SELECT throws_ok(
  $$
    INSERT INTO public.legal_acceptances (user_id, document_key, document_version, listing_id)
    VALUES (
      '11111111-1111-4111-8111-111111111111',
      'account_terms',
      '2026-11-23',
      '44444444-4444-4444-8444-444444444444'
    )
  $$,
  '23514',
  NULL,
  'account terms reject a listing id'
);

SELECT throws_ok(
  $$
    INSERT INTO public.legal_acceptances (user_id, document_key, document_version, listing_id)
    VALUES (
      '11111111-1111-4111-8111-111111111111',
      'privacy_policy',
      '2026-11-23',
      '44444444-4444-4444-8444-444444444444'
    )
  $$,
  '23514',
  NULL,
  'privacy rows reject a listing id'
);

SELECT throws_ok(
  $$
    INSERT INTO public.legal_acceptances (user_id, document_key, document_version)
    VALUES (
      '11111111-1111-4111-8111-111111111111',
      'community_calendar_terms',
      '2026-11-23'
    )
  $$,
  '23514',
  NULL,
  'calendar rows reject a null listing id'
);

SELECT throws_ok(
  $$
    INSERT INTO public.legal_acceptances (user_id, document_key, document_version)
    VALUES (
      '11111111-1111-4111-8111-111111111111',
      'not_a_document',
      '2026-11-23'
    )
  $$,
  '23514',
  NULL,
  'an unknown document key fails'
);

SELECT throws_ok(
  $$
    INSERT INTO public.legal_acceptances (user_id, document_key, document_version)
    VALUES (
      '11111111-1111-4111-8111-111111111111',
      'account_terms',
      ''
    )
  $$,
  '23514',
  NULL,
  'an empty document version fails'
);

SELECT lives_ok(
  $$
    INSERT INTO public.legal_acceptances (
      user_id,
      listing_id,
      document_key,
      document_version
    ) VALUES (
      '11111111-1111-4111-8111-111111111111',
      '44444444-4444-4444-8444-444444444444',
      'community_calendar_terms',
      '2026-11-23'
    )
  $$,
  'a calendar row with a listing id is allowed by the table'
);

SELECT lives_ok(
  $$
    DELETE FROM public.listings
    WHERE id = '44444444-4444-4444-8444-444444444444'
  $$,
  'service role can delete a listing without delete on legal_acceptances'
);

RESET ROLE;

SELECT throws_ok(
  $$
    UPDATE public.legal_acceptances
    SET document_version = 'changed'
    WHERE user_id = '11111111-1111-4111-8111-111111111111'
      AND document_key = 'account_terms'
  $$,
  'P0001',
  'legal_acceptances rows are immutable',
  'a table owner update raises'
);

SELECT is_empty(
  $$
    SELECT 1
    FROM public.legal_acceptances
    WHERE listing_id = '44444444-4444-4444-8444-444444444444'
       OR document_key = 'community_calendar_terms'
  $$,
  'deleting a listing cascades its acceptance row'
);

-- Account deletion is performed by the auth admin, which can delete auth.users.
-- That cascade uses the foreign-key action, not DELETE on legal_acceptances.
DELETE FROM auth.users
WHERE id = '22222222-2222-4222-8222-222222222222';

SELECT is_empty(
  $$
    SELECT 1
    FROM public.legal_acceptances
    WHERE user_id = '22222222-2222-4222-8222-222222222222'
  $$,
  'deleting an account cascades its acceptance rows'
);

SELECT results_eq(
  $$
    SELECT document_key
    FROM public.legal_acceptances
    WHERE user_id = '11111111-1111-4111-8111-111111111111'
    ORDER BY document_key
  $$,
  $$ VALUES ('account_terms'::text), ('privacy_policy'::text) $$,
  'deleting one account leaves other accounts acceptance rows in place'
);

SELECT * FROM finish();

ROLLBACK;
