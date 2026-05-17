-- Select / multiselect options for service_questions (replaces hardcoded option lists in app code)

CREATE TABLE IF NOT EXISTS "public"."service_question_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "value" "text" NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "is_other" boolean DEFAULT false NOT NULL,
    CONSTRAINT "service_question_options_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "service_question_options_question_id_fkey"
        FOREIGN KEY ("question_id") REFERENCES "public"."service_questions"("id") ON DELETE CASCADE,
    CONSTRAINT "service_question_options_question_value_unique"
        UNIQUE ("question_id", "value")
);

CREATE INDEX IF NOT EXISTS "service_question_options_question_id_order_idx"
    ON "public"."service_question_options" ("question_id", "order_index");

ALTER TABLE "public"."service_question_options" OWNER TO "postgres";
ALTER TABLE "public"."service_question_options" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read options for active service questions"
    ON "public"."service_question_options"
    FOR SELECT
    TO "anon", "authenticated"
    USING (
        EXISTS (
            SELECT 1
            FROM "public"."service_questions" "q"
            JOIN "public"."services" "s" ON "s"."id" = "q"."service_id"
            WHERE "q"."id" = "service_question_options"."question_id"
              AND "s"."is_active" = true
        )
    );

GRANT SELECT ON TABLE "public"."service_question_options" TO "anon";
GRANT SELECT ON TABLE "public"."service_question_options" TO "authenticated";
GRANT ALL ON TABLE "public"."service_question_options" TO "service_role";

-- Documentation service inquiry: single-select, renamed question (was multiselect + plural)
UPDATE "public"."service_questions" "q"
SET
    "field_type" = 'select',
    "question_text" = 'What service are you inquiring about?'
FROM "public"."services" "s"
WHERE "q"."service_id" = "s"."id"
  AND "s"."slug" = 'documentation'
  AND "q"."question_text" = 'What service(s) are you inquiring about?';

-- Seed documentation service select/multiselect options (idempotent)
INSERT INTO "public"."service_question_options" ("question_id", "label", "value", "order_index", "is_other")
SELECT "q"."id", "o"."label", "o"."value", "o"."ord", "o"."is_other"
FROM "public"."services" "s"
JOIN "public"."service_questions" "q" ON "q"."service_id" = "s"."id"
CROSS JOIN (
    VALUES
        ('What service are you inquiring about?'::text, 'Photography'::text, 'Photography'::text, 1, false),
        ('What service are you inquiring about?'::text, 'Videography'::text, 'Videography'::text, 2, false),
        ('What service are you inquiring about?'::text, 'Packaged photography & videography services'::text, 'Packaged photography & videography services'::text, 3, false),
        ('What service are you inquiring about?'::text, 'Other'::text, 'Other'::text, 4, true),
        ('What type of project is this?'::text, 'Performance'::text, 'Performance'::text, 1, false),
        ('What type of project is this?'::text, 'Rehearsal'::text, 'Rehearsal'::text, 2, false),
        ('What type of project is this?'::text, 'Event'::text, 'Event'::text, 3, false),
        ('What type of project is this?'::text, 'Other'::text, 'Other'::text, 4, true)
) AS "o"("question_text", "label", "value", "ord", "is_other")
WHERE "s"."slug" = 'documentation'
  AND "q"."question_text" = "o"."question_text"
ON CONFLICT ("question_id", "value") DO NOTHING;
