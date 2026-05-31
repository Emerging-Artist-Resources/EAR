-- Optional name fields for public newsletter signups (e.g. Our Story / About Us inline forms).

ALTER TABLE "public"."newsletter_subscribers"
    ADD COLUMN IF NOT EXISTS "first_name" "text",
    ADD COLUMN IF NOT EXISTS "last_name" "text";

COMMENT ON COLUMN "public"."newsletter_subscribers"."first_name" IS 'From public signup when no profile name; used for Mailchimp merge fields.';
COMMENT ON COLUMN "public"."newsletter_subscribers"."last_name" IS 'From public signup when no profile name; used for Mailchimp merge fields.';
