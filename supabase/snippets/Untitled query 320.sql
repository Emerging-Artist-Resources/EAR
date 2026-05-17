-- Fiscal services inquiry (bookkeeping, education, admin assistance, etc.)

INSERT INTO "public"."services" ("slug", "title", "description", "is_active")
VALUES (
    'fiscal-services',
    'Fiscal Services',
    'Bookkeeping, fiscal mentorship, and hourly fiscal services for artists and arts organizations.',
    true
)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "public"."service_questions" ("service_id", "question_text", "field_type", "is_required", "order_index")
SELECT s."id", x."q", x."ft", x."req", x."ord"
FROM "public"."services" s
CROSS JOIN (
    VALUES
        ('Pronouns'::text, 'text'::text, false, 1),
        ('Budget Size'::text, 'text'::text, true, 2),
        ('What Fiscal Services Are You Interested In?'::text, 'multiselect'::text, true, 3),
        ('Please Explain How We Can Help'::text, 'textarea'::text, false, 4)
) AS x("q", "ft", "req", "ord")
WHERE s."slug" = 'fiscal-services'
  AND NOT EXISTS (
      SELECT 1 FROM "public"."service_questions" q WHERE q."service_id" = s."id"
  );

-- Multiselect options (idempotent)
INSERT INTO "public"."service_question_options" ("question_id", "label", "value", "order_index", "is_other")
SELECT "q"."id", "o"."label", "o"."value", "o"."ord", "o"."is_other"
FROM "public"."services" "s"
JOIN "public"."service_questions" "q" ON "q"."service_id" = "s"."id"
CROSS JOIN (
    VALUES
        (
            'What Fiscal Services Are You Interested In?'::text,
            'Bookkeeping'::text,
            'Bookkeeping'::text,
            1,
            false
        ),
        (
            'What Fiscal Services Are You Interested In?'::text,
            'Bookkeeping Education'::text,
            'Bookkeeping Education'::text,
            2,
            false
        ),
        (
            'What Fiscal Services Are You Interested In?'::text,
            'Fiscal Sponsorship'::text,
            'Fiscal Sponsorship'::text,
            3,
            false
        ),
        (
            'What Fiscal Services Are You Interested In?'::text,
            'Fiscal Administrative Assistance'::text,
            'Fiscal Administrative Assistance'::text,
            4,
            false
        ),
        (
            'What Fiscal Services Are You Interested In?'::text,
            'Other'::text,
            'Other'::text,
            5,
            true
        )
) AS "o"("question_text", "label", "value", "ord", "is_other")
WHERE "s"."slug" = 'fiscal-services'
  AND "q"."question_text" = "o"."question_text"
ON CONFLICT ("question_id", "value") DO NOTHING;
