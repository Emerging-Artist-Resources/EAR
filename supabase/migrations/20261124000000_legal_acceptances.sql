-- Append-only legal acceptance records. Registration writes account terms and
-- privacy rows. Community Calendar rows are allowed by the check so a later
-- phase can insert them without reshaping the table. This migration does not
-- backfill existing accounts or listings.

CREATE TABLE IF NOT EXISTS "public"."legal_acceptances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "listing_id" "uuid",
    "document_key" "text" NOT NULL,
    "document_version" "text" NOT NULL,
    "accepted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "legal_acceptances_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "legal_acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    CONSTRAINT "legal_acceptances_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE,
    CONSTRAINT "legal_acceptances_document_key_check" CHECK (
        ("document_key" = ANY (ARRAY['account_terms'::"text", 'privacy_policy'::"text", 'community_calendar_terms'::"text"]))
    ),
    CONSTRAINT "legal_acceptances_document_version_length_check" CHECK (
        (("char_length"("document_version") >= 1) AND ("char_length"("document_version") <= 64))
    ),
    CONSTRAINT "legal_acceptances_listing_scope_check" CHECK (
        (
            ("document_key" = ANY (ARRAY['account_terms'::"text", 'privacy_policy'::"text"]))
            AND ("listing_id" IS NULL)
        )
        OR (
            ("document_key" = 'community_calendar_terms'::"text")
            AND ("listing_id" IS NOT NULL)
        )
    )
);

CREATE INDEX "idx_legal_acceptances_user_document_accepted_at"
    ON "public"."legal_acceptances" USING "btree" ("user_id", "document_key", "accepted_at" DESC);

CREATE INDEX "idx_legal_acceptances_listing_id"
    ON "public"."legal_acceptances" USING "btree" ("listing_id")
    WHERE ("listing_id" IS NOT NULL);

ALTER TABLE "public"."legal_acceptances" OWNER TO "postgres";

COMMENT ON TABLE "public"."legal_acceptances" IS 'Append-only record of a user accepting one legal document version. Account deletion cascades these rows.';

CREATE OR REPLACE FUNCTION "public"."stamp_legal_acceptance_accepted_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.accepted_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."prevent_legal_acceptance_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  RAISE EXCEPTION 'legal_acceptances rows are immutable';
END;
$$;

ALTER FUNCTION "public"."stamp_legal_acceptance_accepted_at"() OWNER TO "postgres";
ALTER FUNCTION "public"."prevent_legal_acceptance_update"() OWNER TO "postgres";

CREATE OR REPLACE TRIGGER "legal_acceptances_stamp_accepted_at"
    BEFORE INSERT ON "public"."legal_acceptances"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."stamp_legal_acceptance_accepted_at"();

CREATE OR REPLACE TRIGGER "legal_acceptances_prevent_update"
    BEFORE UPDATE ON "public"."legal_acceptances"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."prevent_legal_acceptance_update"();

ALTER TABLE "public"."legal_acceptances" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "legal_acceptances_select_own"
    ON "public"."legal_acceptances"
    FOR SELECT
    TO "authenticated"
    USING (("user_id" = (SELECT "auth"."uid"())));

CREATE POLICY "legal_acceptances_select_admin"
    ON "public"."legal_acceptances"
    FOR SELECT
    TO "authenticated"
    USING ((SELECT "public"."is_admin"()));

-- Default privileges grant ALL to anon, authenticated, and service_role.
-- Revoke those, then leave authenticated with SELECT and service_role with
-- SELECT and INSERT only. ON DELETE CASCADE does not need DELETE here: the
-- foreign-key action runs as the table owner.
REVOKE ALL ON TABLE "public"."legal_acceptances" FROM PUBLIC;
REVOKE ALL ON TABLE "public"."legal_acceptances" FROM "anon";
REVOKE ALL ON TABLE "public"."legal_acceptances" FROM "authenticated";
REVOKE ALL ON TABLE "public"."legal_acceptances" FROM "service_role";
GRANT SELECT ON TABLE "public"."legal_acceptances" TO "authenticated";
GRANT SELECT, INSERT ON TABLE "public"."legal_acceptances" TO "service_role";

-- Postgres grants EXECUTE to PUBLIC, and Supabase default privileges also
-- grant it to anon and authenticated. Trigger execution does not re-check
-- EXECUTE; these revokes keep the functions off the API.
REVOKE ALL ON FUNCTION "public"."stamp_legal_acceptance_accepted_at"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."stamp_legal_acceptance_accepted_at"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."stamp_legal_acceptance_accepted_at"() FROM "authenticated";
REVOKE ALL ON FUNCTION "public"."prevent_legal_acceptance_update"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."prevent_legal_acceptance_update"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."prevent_legal_acceptance_update"() FROM "authenticated";
GRANT EXECUTE ON FUNCTION "public"."stamp_legal_acceptance_accepted_at"() TO "service_role";
GRANT EXECUTE ON FUNCTION "public"."prevent_legal_acceptance_update"() TO "service_role";
