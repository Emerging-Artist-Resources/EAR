# Newsletter / Mailchimp integration

## Environment variables

Add to `.env.local`:

```bash
MAILCHIMP_API_KEY=...
MAILCHIMP_SERVER_PREFIX=us21
MAILCHIMP_AUDIENCE_ID=...

# Optional
MAILCHIMP_SYNC_DISABLED=true
SYNC_DISABLED=true
CRON_SECRET=...   # for POST /api/cron/newsletter-sync
```

## Architecture

- **`newsletter_subscribers`** — canonical subscription + sync metadata
- **`profiles.newsletter_*`** — mirrored on write (convenience for UI/admin)
- **`syncNewsletterPreferences()`** — only entry point for writes
- Mailchimp sync is async (never blocks signup/profile/modal)

Tags in Mailchimp (must match exactly): `EAR Newsletter`, `Calendar`.

## Cron retry

```bash
curl -X POST https://your-app.com/api/cron/newsletter-sync \
  -H "Authorization: Bearer $CRON_SECRET"
```

Schedule nightly in Vercel Cron or similar.

## Backfill

After migration:

```bash
npm run newsletter:backfill
```

Requires `SUPABASE_SERVICE_ROLE_KEY` (or `SERVICE_ROLE_KEY`) and Supabase URL in the environment.
