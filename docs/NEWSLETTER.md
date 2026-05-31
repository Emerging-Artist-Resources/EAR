# Newsletter / Mailchimp integration

## Environment variables

Add to `.env.local`:

```bash
MAILCHIMP_API_KEY=...
MAILCHIMP_SERVER_PREFIX=us21
MAILCHIMP_AUDIENCE_ID=...

# Optional — skip API lookup; use interest IDs from Mailchimp (Audience → Groups → option → API)
MAILCHIMP_INTEREST_EAR_ID=...
MAILCHIMP_INTEREST_CALENDAR_ID=...

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

## Mailchimp audience mapping

**Groups** (category `EAR Emailing Lists`, checkbox type — primary segmentation):

| App field | Mailchimp group option |
|-----------|------------------------|
| `subscribed_to_newsletter` | `EAR General Email List` |
| `subscribed_to_calendar` | `Community Calendar Weekly Email List` |

**Tags** (legacy, still synced for existing automations): `EAR Newsletter`, `Calendar`.

**Name**: `profiles.name` when `profile_id` is set; otherwise `newsletter_subscribers.first_name` / `last_name` from public signup (Our Story / About Us inline forms).

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

To re-push existing subscribers to Mailchimp after fixing sync, set `needs_sync = true` on rows in `newsletter_subscribers` and run the cron (or trigger profile/newsletter saves).
