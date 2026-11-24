-- Claim state for Stripe webhook retries.
--
-- The previous handler inserts only id, type, listing_id, donation_id, and
-- stripe_created. These defaults keep that INSERT valid after this migration
-- is applied and before the new handler is deployed:
--
--   status       NOT NULL DEFAULT 'completed'
--   claim_token  nullable, no default
--   claimed_at   nullable, no default
--   completed_at nullable, no default
--
-- An old-handler insert during that overlap stores status = 'completed' and
-- leaves claim_token, claimed_at, and completed_at null. The new handler
-- treats status = 'completed' as finished and does not replay those rows,
-- including events the old handler failed after inserting. A processing or
-- failed default would replay work the old handler already finished, because
-- that handler never updates these columns.
--
-- The new handler always writes status = 'processing', claim_token, and
-- claimed_at itself. It does not rely on the status default.

ALTER TABLE public.stripe_webhook_events
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS claim_token uuid,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Rows already stored when this migration runs were inserted by the old
-- handler. status is completed via the column default. Record completed_at
-- from created_at. Do not invent claim tokens and do not replay the events.
-- Inserts that commit after this migration are not updated here, so overlap
-- rows keep a null completed_at and are still skipped because status is completed.
UPDATE public.stripe_webhook_events
SET completed_at = created_at
WHERE completed_at IS NULL
  AND status = 'completed'
  AND claim_token IS NULL;

ALTER TABLE public.stripe_webhook_events
  DROP CONSTRAINT IF EXISTS stripe_webhook_events_status_check;

ALTER TABLE public.stripe_webhook_events
  ADD CONSTRAINT stripe_webhook_events_status_check
  CHECK (status IN ('processing', 'failed', 'completed'));

COMMENT ON TABLE public.stripe_webhook_events IS
  'Stripe webhook deliveries. status=completed means the required work finished, or the row was recorded by the previous handler (insert before processing), including during migration deploy overlap. Presence of the row alone is not success for rows the new handler claims.';

COMMENT ON COLUMN public.stripe_webhook_events.status IS
  'processing, failed, or completed. Defaults to completed so the previous handler INSERT stays valid during deploy overlap; those rows are not replayed.';

COMMENT ON COLUMN public.stripe_webhook_events.claim_token IS
  'Token of the attempt that owns a processing row. Replaced when a failed or stale row is reclaimed. Marking failed or completed requires this token and status=processing. Null on rows written by the previous handler.';

COMMENT ON COLUMN public.stripe_webhook_events.claimed_at IS
  'When the current claim_token was written. A processing row older than the application stale window may be reclaimed.';

COMMENT ON COLUMN public.stripe_webhook_events.completed_at IS
  'When an owning attempt marked the event completed. Null on overlap rows inserted by the previous handler; those stay completed because status defaults to completed.';
