-- Canonical newsletter subscriptions + provider sync metadata (service-role writes only).

CREATE TABLE IF NOT EXISTS "public"."newsletter_subscribers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "normalized_email" "text" NOT NULL,
    "profile_id" "uuid",
    "subscribed_to_newsletter" boolean DEFAULT false NOT NULL,
    "subscribed_to_calendar" boolean DEFAULT false NOT NULL,
    "source" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "source_context" "text",
    "sync_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "sync_last_error" "text",
    "synced_at" timestamp with time zone,
    "needs_sync" boolean DEFAULT true NOT NULL,
    "sync_retry_count" integer DEFAULT 0 NOT NULL,
    "last_sync_attempt_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "newsletter_subscribers_normalized_email_key" UNIQUE ("normalized_email"),
    CONSTRAINT "newsletter_subscribers_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscribers_profile_id_unique"
    ON "public"."newsletter_subscribers" ("profile_id")
    WHERE ("profile_id" IS NOT NULL);

CREATE INDEX IF NOT EXISTS "newsletter_subscribers_needs_sync_idx"
    ON "public"."newsletter_subscribers" ("last_sync_attempt_at")
    WHERE ("needs_sync" = true);

ALTER TABLE "public"."newsletter_subscribers" OWNER TO "postgres";

ALTER TABLE "public"."newsletter_subscribers" ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE TRIGGER "set_newsletter_subscribers_updated_at"
    BEFORE UPDATE ON "public"."newsletter_subscribers"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."set_updated_at"();

GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "service_role";

COMMENT ON TABLE "public"."newsletter_subscribers" IS 'Canonical newsletter subscription state; Mailchimp sync reads this table only.';
