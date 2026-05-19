-- One CONCURRENTLY index per migration (Supabase / Postgres requirement).
-- Safe on local, staging, and production via: supabase db push

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_approved_submitted_at
  ON public.listings (submitted_at DESC)
  WHERE status = 'approved' AND deleted_at IS NULL;
