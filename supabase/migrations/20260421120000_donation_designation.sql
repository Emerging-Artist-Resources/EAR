-- Per-artist donation designation (JSONB on profiles + snapshots on donations)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS donation_designation_config jsonb;

COMMENT ON COLUMN public.profiles.donation_designation_config IS
  'Optional JSON: fieldLabel, allowNoPreference, options[{id,label}] for /donate/[slug] designation; null = feature off';

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS designation_option_id text;

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS designation_label_snapshot text;

COMMENT ON COLUMN public.donations.designation_option_id IS
  'Stable option id at donation time (e.g. split, charity slug); null when designation feature not used for this row';

COMMENT ON COLUMN public.donations.designation_label_snapshot IS
  'Display label at donation time for receipts; includes no-preference label when id is split';
