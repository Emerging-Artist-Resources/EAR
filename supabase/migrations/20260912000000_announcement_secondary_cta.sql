-- Optional second action button on the announcement page only (not popup or dashboard).

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS cta_secondary_kind text,
  ADD COLUMN IF NOT EXISTS cta_secondary_label text,
  ADD COLUMN IF NOT EXISTS cta_secondary_href text;

ALTER TABLE public.announcements
  DROP CONSTRAINT IF EXISTS announcements_cta_secondary_kind_check;

ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_cta_secondary_kind_check
  CHECK (cta_secondary_kind IS NULL OR cta_secondary_kind IN ('link', 'authenticated_link'));
