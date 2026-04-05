# Artist Donation Launch Runbook

This runbook is for launching artist-specific donation links at `/donate/{slug}` with Stripe Checkout and webhook confirmation.

## Scope

- In scope: artist-tagged donations, sponsor Stripe config, webhook validation, go-live checks.
- Out of scope: fiscal sponsorship inquiry form workflow.

## Owners

- App owner: EAR product/engineering
- Stripe owner: Sponsor Stripe admin
- DB owner: Supabase project admin

## Preconditions

- Production deploy includes donation routes and webhook handler.
- DB verification checks already pass for:
  - `profiles.slug`
  - `profiles.donation_page_message` and `profiles.donation_page_image_path` (optional hero on `/donate/{slug}`; see below)
  - `donations` recipient columns and indexes
  - `stripe_webhook_events.donation_id`
- Artist slugs exist and are unique.

## Optional: Donation page hero (message + image)

Applies the SQL in `sql_files/add_donation_page_content.sql` so each profile can have optional copy and a hero image on `/donate/{slug}` without changing default headline text.

### Storage bucket (Supabase Dashboard)

1. Create bucket **`donation-page-photos`** (name must match `DONATION_PAGE_PHOTOS_BUCKET` in `src/lib/storage/donationPagePhotos.ts`).
2. Set the bucket to **Public** (or add a storage policy that allows **anonymous** read on objects). Logged-out donors must be able to load the image URL; authenticated-only read will break the hero for most visitors.
3. Upload an image to a path such as `profiles/<profile_uuid>/donation-hero.jpg` (use the artist’s `profiles.id`).

### Link the profile row

Set the **storage path only** (not the full URL), for example:

```sql
UPDATE public.profiles
SET
  donation_page_message = 'Thank you for supporting my work.',
  donation_page_image_path = 'profiles/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11/donation-hero.jpg'
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
```

Clear optional fields:

```sql
UPDATE public.profiles
SET donation_page_message = NULL, donation_page_image_path = NULL
WHERE id = '<profile_uuid>';
```

Verify in an **incognito / logged-out** window that `/donate/{slug}` shows the image (no 401/403 on the image request).

## Environment Variables

Set in deployment environment for production:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SPONSOR_SECRET_KEY`
- `STRIPE_SPONSOR_WEBHOOK_SECRET`

Notes:

- Artist-tagged donations use `STRIPE_SPONSOR_SECRET_KEY`.
- Webhook signature verification must accept sponsor events via `STRIPE_SPONSOR_WEBHOOK_SECRET`.

## Webhook Configuration (Sponsor Stripe Dashboard)

Create or update webhook endpoint:

- URL: `https://<your-domain>/api/stripe/webhook`
- Events:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `charge.refunded`

Copy the webhook signing secret into `STRIPE_SPONSOR_WEBHOOK_SECRET`.

## Pre-Access Readiness (Do This Now)

1. Keep artist links unpublished externally.
2. Confirm launch roster sheet has:
   - artist name
   - `profile_id`
   - `slug`
   - public URL (`/donate/{slug}`)
3. Complete one generic donation flow test at `/donate` to validate app + webhook baseline.
4. Prepare rollback decision: temporarily hide artist links if webhook failures appear.

## Sponsor Access Day: 15-Minute Go-Live Procedure

1. Add sponsor env vars in production:
   - `STRIPE_SPONSOR_SECRET_KEY`
   - `STRIPE_SPONSOR_WEBHOOK_SECRET`
2. Ensure sponsor webhook endpoint is active and subscribed to required events.
3. Perform one small-amount artist donation test:
   - open `/donate/{known-slug}`
   - complete checkout
   - return to success page
4. Run post-payment SQL verification (below).
5. If checks pass, publish artist links.

## Post-Payment SQL Verification

Run in Supabase SQL editor after the first artist test payment.

```sql
-- Most recent artist donation rows
SELECT
  d.id,
  d.created_at,
  d.amount,
  d.currency,
  d.payment_status,
  d.recipient_user_id,
  p.slug AS recipient_slug,
  d.stripe_checkout_session_id,
  d.stripe_payment_intent_id,
  d.stripe_charge_id
FROM public.donations d
LEFT JOIN public.profiles p ON p.id = d.recipient_user_id
WHERE d.recipient_user_id IS NOT NULL
ORDER BY d.created_at DESC
LIMIT 10;
```

Expected for the test row:

- `recipient_user_id` is populated and matches the artist.
- `stripe_checkout_session_id` is non-null.
- `payment_status` becomes `paid` (may briefly show `requires_payment` before webhook lands).

Optional webhook audit query:

```sql
SELECT id, type, donation_id, stripe_created, created_at
FROM public.stripe_webhook_events
WHERE donation_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;
```

## Go/No-Go Criteria

Go live only if all are true:

- Artist checkout completes without API 4xx/5xx errors.
- Webhook events from sponsor Stripe are accepted (no signature verification failures).
- Test artist donation reaches `payment_status = 'paid'`.
- Success page flow is stable for the test user.

## Rollback

If any critical failure appears:

1. Unpublish or hide artist donation links.
2. Keep generic donation page active if unaffected.
3. Capture failing session IDs and webhook event IDs.
4. Fix config and re-run the 15-minute procedure.

## Common Failure Modes

- Missing `STRIPE_SPONSOR_SECRET_KEY`:
  - Artist donation session creation returns service-unavailable response.
- Missing or wrong `STRIPE_SPONSOR_WEBHOOK_SECRET`:
  - Sponsor webhook deliveries fail signature verification.
- Webhook endpoint misconfigured in sponsor Stripe:
  - Checkout succeeds in Stripe but DB status does not transition to `paid`.
