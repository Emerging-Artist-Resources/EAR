-- Admin pending queue: filter by status, sort by submitted_at

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_status_submitted_at
  ON public.listings (status, submitted_at DESC)
  WHERE deleted_at IS NULL;
