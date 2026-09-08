-- App-wide first-visit announcement popup (end state).
-- At most one published, non-archived, popup_enabled row is shown at a time.

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS popup_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS popup_headline text,
  ADD COLUMN IF NOT EXISTS popup_body text,
  ADD COLUMN IF NOT EXISTS popup_cta_label text,
  ADD COLUMN IF NOT EXISTS popup_revision integer NOT NULL DEFAULT 1;

ALTER TABLE public.announcements
  DROP CONSTRAINT IF EXISTS announcements_popup_revision_check;

ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_popup_revision_check
  CHECK (popup_revision >= 1);
