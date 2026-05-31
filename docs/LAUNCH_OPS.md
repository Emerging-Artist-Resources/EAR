# Launch operations runbook

Operational guide for EAR (performance-calendar) launch and incident response.

## Environment variables

### Observability

| Variable | Required | Description |
|----------|----------|-------------|
| `SENTRY_DSN` | Server | Server-side Sentry DSN (API routes, SSR) |
| `NEXT_PUBLIC_SENTRY_DSN` | **Client** | **Required for browser errors.** Must match `SENTRY_DSN` (or use the same DSN value). Without this, only server/API errors appear in Sentry. |
| `SENTRY_ORG` | Build | Sentry org slug (source maps upload) |
| `SENTRY_PROJECT` | Build | Sentry project slug |
| `SENTRY_AUTH_TOKEN` | Build | Sentry auth token for releases |

### Rate limiting (Upstash)

| Variable | Required | Description |
|----------|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | Prod recommended | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Prod recommended | Upstash Redis REST token |

Without Upstash in production, rate limits **fail open** (requests allowed) with a warning log.

### Kill switches

Set to `true` in Vercel → redeploy. Never default in production.

| Variable | Effect |
|----------|--------|
| `DISABLE_RATE_LIMIT` | Skip Upstash rate limits |
| `DISABLE_SENTRY` | Disable server-side Sentry init and capture |
| `NEXT_PUBLIC_DISABLE_SENTRY` | Disable client-side Sentry init and capture (set both to fully disable) |
| `DISABLE_EMAILS` | Skip Postmark sends (DB writes continue) |
| `DISABLE_BACKGROUND_SYNC` | Skip newsletter Mailchimp cron processing |

`READ_ONLY_MODE` — not implemented; document for future if submission freeze is needed.

### Debug

| Variable | Description |
|----------|-------------|
| `DEBUG_SCHEDULE=true` | Enable `[EAR piece schedule]` logs in production |

---

## Launch index migrations (CONCURRENTLY)

Four migration files (one index each — required by Postgres/Supabase):

- `20260519120000_launch_idx_listings_approved_submitted_at.sql`
- `20260519120001_launch_idx_listings_status_submitted_at.sql`
- `20260519120002_launch_idx_service_inquiries_user_created.sql`
- `20260519120003_launch_idx_listing_occurrences_starts_type.sql`

**Apply everywhere the same way** (local, staging, production):

```bash
supabase db push
```

`CREATE INDEX CONCURRENTLY` is safe on dev/staging (slightly slower on empty tables, no write lock). Use the same migrations on all environments.

**Verify indexes exist:**

```sql
SELECT indexname FROM pg_indexes
WHERE tablename IN ('listings', 'listing_occurrences', 'service_inquiries')
  AND indexname LIKE 'idx_%';
```

**If a concurrent build fails** (invalid index), drop and re-run that migration’s SQL:

```sql
DROP INDEX CONCURRENTLY IF EXISTS idx_listings_approved_submitted_at;
-- then re-apply the single migration file or run CREATE INDEX CONCURRENTLY again
```

**Manual SQL Editor** is only needed if `db push` failed mid-way; run one `CREATE INDEX CONCURRENTLY IF NOT EXISTS ...` per failed file.

---

## Rate limits (default)

| Route | Limit |
|-------|-------|
| `GET /api/calendar?q=` | 30 / min / IP |
| `GET /api/calendar` (feed) | 120 / min / IP |
| `POST /api/events` | 10 / hour / IP, 20 / hour / user |
| `POST /api/service-inquiries` | 5 / hour / IP |
| `POST /api/newsletter/subscribe` | 5 / 15 min / IP |

---

## Route timeout audit (launch checklist)

| Area | Status / notes |
|------|----------------|
| Stripe webhook | Idempotent via `stripe_webhook_events`; returns 200 on duplicate; 500 triggers Stripe retry |
| Email sends | Non-blocking on event POST (try/catch); `DISABLE_EMAILS` respected |
| Newsletter cron | Bounded batch (50); `DISABLE_BACKGROUND_SYNC` guard |
| Photo uploads | Client → Supabase Storage (not through API body) |
| Listing detail | Photos use `Promise.all` for signed URLs; N+1 on storage acceptable post-launch |

---

## Top 5 slow queries (pre-launch)

1. Open Supabase → **Query Performance** (or `pg_stat_statements`).
2. Note the five slowest / highest-volume queries **before** index migration.
3. Re-check **after** `CONCURRENTLY` indexes on prod.
4. Watch for: unindexed `ORDER BY submitted_at`, calendar range scans, RLS subqueries on `listings`.

---

## Load testing

Scripts in `scripts/load/` (k6). Example:

```bash
# Install k6: https://k6.io/docs/get-started/installation/
BASE_URL=https://your-staging.vercel.app k6 run scripts/load/calendar.js
```

**Success criteria (staging):** p95 &lt; 2s for calendar GET; error rate &lt; 1% at 50 VUs for 5 minutes.

---

## Rollback

1. **Vercel:** Deployments → promote previous production deployment.
2. **Kill switches:** Prefer `DISABLE_EMAILS` / `DISABLE_BACKGROUND_SYNC` / `DISABLE_RATE_LIMIT` before code rollback for email storms or false-positive 429s.
3. **Database:** Indexes are safe to leave; do not drop indexes under load.

---

## Launch-day procedure

### 1 hour before launch

- [ ] Confirm Vercel env: Sentry DSN, Upstash, Stripe, Postmark, Supabase
- [ ] Stripe webhook test event in dashboard
- [ ] Test Postmark send (`DISABLE_EMAILS` unset)
- [ ] Supabase backup + Query Performance baseline
- [ ] Open dashboards: Sentry, Vercel, Supabase
- [ ] Kill switches **unset** in production

### During launch (first 2–4 hours)

- Sentry: new issues, error rate
- Vercel: function duration, 5xx, invocations
- Supabase: CPU, connections, slow queries
- Stripe: webhook failures
- Postmark: bounces / complaints

### If issues occur

1. Identify layer (DB / API / external) from dashboards
2. Soften load: bump cache `s-maxage` via deploy if needed; `DISABLE_BACKGROUND_SYNC=true`
3. Stop bleeding: `DISABLE_EMAILS` or `DISABLE_RATE_LIMIT`
4. Rollback Vercel deployment if bad code shipped
5. Do not drop DB indexes; reduce traffic or disable heavy features instead

**Do not** refactor search (`searchListingsRepo` JS filter) unless Supabase CPU or search p95 forces it.

---

## Dashboards

- [Vercel](https://vercel.com) — Functions, Analytics, Deployments
- [Supabase](https://supabase.com/dashboard) — Database health, Query Performance
- [Sentry](https://sentry.io) — Errors, performance
- [Stripe](https://dashboard.stripe.com) — Webhooks, payments
