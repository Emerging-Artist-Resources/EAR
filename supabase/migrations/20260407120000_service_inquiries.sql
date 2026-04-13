-- Service catalog + dynamic inquiry forms + answers
-- Writes go through Next.js API + service role; selective reads for catalog and own inquiries.

CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "price" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "services_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "services_slug_key" UNIQUE ("slug")
);

CREATE TABLE IF NOT EXISTS "public"."service_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_id" "uuid" NOT NULL,
    "question_text" "text" NOT NULL,
    "field_type" "text" NOT NULL,
    "is_required" boolean DEFAULT false NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "service_questions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "service_questions_field_type_check" CHECK (
        ("field_type" = ANY (ARRAY[
            'text'::text,
            'textarea'::text,
            'select'::text,
            'date'::text,
            'time'::text,
            'multiselect'::text
        ]))
    ),
    CONSTRAINT "service_questions_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "service_questions_service_id_order_idx"
    ON "public"."service_questions" ("service_id", "order_index");

CREATE TABLE IF NOT EXISTS "public"."service_inquiries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "service_slug" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "service_inquiries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "service_inquiries_status_check" CHECK (
        ("status" = ANY (ARRAY['pending'::text, 'contacted'::text, 'completed'::text]))
    ),
    CONSTRAINT "service_inquiries_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE RESTRICT,
    CONSTRAINT "service_inquiries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "service_inquiries_service_id_idx" ON "public"."service_inquiries" ("service_id");

CREATE TABLE IF NOT EXISTS "public"."service_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "inquiry_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "answer_text" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "service_answers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "service_answers_inquiry_question_unique" UNIQUE ("inquiry_id", "question_id"),
    CONSTRAINT "service_answers_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "public"."service_inquiries"("id") ON DELETE CASCADE,
    CONSTRAINT "service_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."service_questions"("id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "service_answers_inquiry_id_idx" ON "public"."service_answers" ("inquiry_id");

ALTER TABLE "public"."services" OWNER TO "postgres";
ALTER TABLE "public"."service_questions" OWNER TO "postgres";
ALTER TABLE "public"."service_inquiries" OWNER TO "postgres";
ALTER TABLE "public"."service_answers" OWNER TO "postgres";

ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."service_questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."service_inquiries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."service_answers" ENABLE ROW LEVEL SECURITY;

-- Catalog: active services visible to everyone
CREATE POLICY "Anyone can read active services"
    ON "public"."services"
    FOR SELECT
    TO "anon", "authenticated"
    USING ("is_active" = true);

-- Questions for active services
CREATE POLICY "Anyone can read questions for active services"
    ON "public"."service_questions"
    FOR SELECT
    TO "anon", "authenticated"
    USING (
        EXISTS (
            SELECT 1
            FROM "public"."services" "s"
            WHERE "s"."id" = "service_questions"."service_id"
              AND "s"."is_active" = true
        )
    );

-- Own inquiries (authenticated)
CREATE POLICY "Users can read own service inquiries"
    ON "public"."service_inquiries"
    FOR SELECT
    TO "authenticated"
    USING ("user_id" IS NOT NULL AND "auth"."uid"() = "user_id");

CREATE POLICY "Admins can read all service inquiries"
    ON "public"."service_inquiries"
    FOR SELECT
    TO "authenticated"
    USING ("public"."is_admin"());

-- Answers for inquiries the user can see
CREATE POLICY "Users can read answers for own inquiries"
    ON "public"."service_answers"
    FOR SELECT
    TO "authenticated"
    USING (
        EXISTS (
            SELECT 1
            FROM "public"."service_inquiries" "i"
            WHERE "i"."id" = "service_answers"."inquiry_id"
              AND "i"."user_id" IS NOT NULL
              AND "i"."user_id" = "auth"."uid"()
        )
    );

CREATE POLICY "Admins can read all service answers"
    ON "public"."service_answers"
    FOR SELECT
    TO "authenticated"
    USING ("public"."is_admin"());

GRANT SELECT ON TABLE "public"."services" TO "anon";
GRANT SELECT ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";

GRANT SELECT ON TABLE "public"."service_questions" TO "anon";
GRANT SELECT ON TABLE "public"."service_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."service_questions" TO "service_role";

GRANT SELECT ON TABLE "public"."service_inquiries" TO "authenticated";
GRANT ALL ON TABLE "public"."service_inquiries" TO "service_role";

GRANT SELECT ON TABLE "public"."service_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."service_answers" TO "service_role";

-- Seed: Documentation service + questions (idempotent by slug / empty questions)
INSERT INTO "public"."services" ("slug", "title", "description", "is_active")
VALUES (
    'documentation',
    'Documentation',
    'Photography and videography services for performances and events.',
    true
)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "public"."service_questions" ("service_id", "question_text", "field_type", "is_required", "order_index")
SELECT s."id", x."q", x."ft", x."req", x."ord"
FROM "public"."services" s
CROSS JOIN (
    VALUES
        ('Pronouns'::text, 'text'::text, false, 1),
        ('What service(s) are you inquiring about?', 'multiselect', true, 2),
        ('What type of project is this?', 'select', true, 3),
        ('Date of requested service', 'date', true, 4),
        ('Time of requested service', 'time', true, 5),
        ('Requested coverage length', 'text', false, 6),
        ('What is your budget?', 'text', true, 7),
        ('Anything else you would like us to know?', 'textarea', false, 8)
) AS x("q", "ft", "req", "ord")
WHERE s."slug" = 'documentation'
  AND NOT EXISTS (
      SELECT 1 FROM "public"."service_questions" q WHERE q."service_id" = s."id"
  );
