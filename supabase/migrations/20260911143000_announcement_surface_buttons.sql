-- Independent Learn more / action-button visibility per surface.
-- Defaults keep current behavior: both Learn more buttons on, popup reuses the announcement action.

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS dashboard_learn_more_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS popup_learn_more_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS popup_show_announcement_cta boolean NOT NULL DEFAULT true;
