-- Short copy for the profile dashboard widget (separate from the full announcement).

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS dashboard_widget_body text;
