-- Fix hourly fiscal services inquiry options (were incorrectly seeded with bookkeeping items).

DELETE FROM "public"."service_question_options" "o"
USING "public"."service_questions" "q"
JOIN "public"."services" "s" ON "s"."id" = "q"."service_id"
WHERE "o"."question_id" = "q"."id"
  AND "s"."slug" = 'fiscal-services'
  AND "q"."question_text" = 'What hourly fiscal services are you interested in?';

INSERT INTO "public"."service_question_options" ("question_id", "label", "value", "order_index", "is_other")
SELECT "q"."id", "o"."label", "o"."value", "o"."ord", "o"."is_other"
FROM "public"."services" "s"
JOIN "public"."service_questions" "q" ON "q"."service_id" = "s"."id"
CROSS JOIN (
    VALUES
        (
            'Accounting software setup and configuration'::text,
            'Accounting software setup and configuration'::text,
            1,
            false
        ),
        (
            'Payroll processor selection and setup'::text,
            'Payroll processor selection and setup'::text,
            2,
            false
        ),
        (
            'Financial reporting systems'::text,
            'Financial reporting systems'::text,
            3,
            false
        ),
        (
            'Donation tracking systems'::text,
            'Donation tracking systems'::text,
            4,
            false
        ),
        (
            'Expense management workflows'::text,
            'Expense management workflows'::text,
            5,
            false
        ),
        (
            'Recordkeeping best practices'::text,
            'Recordkeeping best practices'::text,
            6,
            false
        ),
        (
            'Grant Preparation Assistance'::text,
            'Grant Preparation Assistance'::text,
            7,
            false
        ),
        ('Other'::text, 'Other'::text, 8, true)
) AS "o"("label", "value", "ord", "is_other")
WHERE "s"."slug" = 'fiscal-services'
  AND "q"."question_text" = 'What hourly fiscal services are you interested in?'
ON CONFLICT ("question_id", "value") DO NOTHING;
