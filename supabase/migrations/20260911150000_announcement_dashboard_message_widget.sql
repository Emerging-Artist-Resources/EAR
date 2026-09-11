-- Text-only dashboard cards (no copyable code).

ALTER TABLE public.announcements
  DROP CONSTRAINT IF EXISTS announcements_dashboard_widget_check;

ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_dashboard_widget_check
  CHECK (dashboard_widget IN ('none', 'message', 'copyable_value', 'member_code'));
