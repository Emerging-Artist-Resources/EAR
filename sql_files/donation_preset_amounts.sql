-- Optional: apply manually if not using supabase migration
-- Mirrors supabase/migrations/20260609120000_donation_preset_amounts.sql

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS donation_preset_amounts integer[];

COMMENT ON COLUMN public.profiles.donation_preset_amounts IS
  'Optional preset donation button amounts in whole USD dollars for /donate/[slug]; null = app default';
