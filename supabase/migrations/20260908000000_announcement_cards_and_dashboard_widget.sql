-- Announcement cards + dashboard benefit widget (end state).
-- Drops severity type; adds optional hero, CTA, and dashboard copyable-value fields.

ALTER TABLE public.announcements
  DROP COLUMN IF EXISTS type;

DROP TYPE IF EXISTS public.announcement_type;

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS cta_kind text,
  ADD COLUMN IF NOT EXISTS cta_label text,
  ADD COLUMN IF NOT EXISTS cta_href text,
  ADD COLUMN IF NOT EXISTS dashboard_widget text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS dashboard_widget_label text,
  ADD COLUMN IF NOT EXISTS dashboard_widget_value text;

ALTER TABLE public.announcements
  DROP CONSTRAINT IF EXISTS announcements_cta_kind_check;

ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_cta_kind_check
  CHECK (cta_kind IS NULL OR cta_kind IN ('link', 'authenticated_link'));

ALTER TABLE public.announcements
  DROP CONSTRAINT IF EXISTS announcements_dashboard_widget_check;

ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_dashboard_widget_check
  CHECK (dashboard_widget IN ('none', 'copyable_value', 'member_code'));
