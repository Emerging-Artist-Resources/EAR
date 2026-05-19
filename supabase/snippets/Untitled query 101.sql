-- Calendar range queries filtered by occurrence_type

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listing_occurrences_starts_type
  ON public.listing_occurrences (starts_at_utc, occurrence_type);
