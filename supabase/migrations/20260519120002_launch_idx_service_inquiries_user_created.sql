-- Profile service inquiry history

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_inquiries_user_created
  ON public.service_inquiries (user_id, created_at DESC);
