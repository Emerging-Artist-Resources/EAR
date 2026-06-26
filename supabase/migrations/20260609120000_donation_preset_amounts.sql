-- Optional preset donation button amounts per artist profile (/donate/[slug])

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS donation_preset_amounts integer[];

COMMENT ON COLUMN public.profiles.donation_preset_amounts IS
  'Optional preset donation button amounts in whole USD dollars for /donate/[slug]; null = app default';
