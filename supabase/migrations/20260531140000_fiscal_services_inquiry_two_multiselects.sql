-- Fiscal services inquiry: split into two optional multiselects (comprehensive + hourly).

-- 1) Rename and soften the existing services question → comprehensive (optional).
UPDATE "public"."service_questions" "sq"
SET
    "question_text" = 'What comprehensive fiscal services are you interested in?',
    "is_required" = false,
    "order_index" = 3
FROM "public"."services" "s"
WHERE "sq"."service_id" = "s"."id"
  AND "s"."slug" = 'fiscal-services'
  AND "sq"."question_text" IN (
      'What Fiscal Services Are You Interested In?',
      'What fiscal services are you interested in?'
  );

-- 2) Replace comprehensive multiselect options.
DELETE FROM "public"."service_question_options" "o"
USING "public"."service_questions" "q"
JOIN "public"."services" "s" ON "s"."id" = "q"."service_id"
WHERE "o"."question_id" = "q"."id"
  AND "s"."slug" = 'fiscal-services'
  AND "q"."question_text" = 'What comprehensive fiscal services are you interested in?';

INSERT INTO "public"."service_question_options" ("question_id", "label", "value", "order_index", "is_other")
SELECT "q"."id", "o"."label", "o"."value", "o"."ord", "o"."is_other"
FROM "public"."services" "s"
JOIN "public"."service_questions" "q" ON "q"."service_id" = "s"."id"
CROSS JOIN (
    VALUES
        ('Fiscal Mentorship'::text, 'Fiscal Mentorship'::text, 1, false),
        ('Bookkeeping'::text, 'Bookkeeping'::text, 2, false),
        ('Fiscal Sponsorship'::text, 'Fiscal Sponsorship'::text, 3, false),
        ('Other'::text, 'Other'::text, 4, true)
) AS "o"("label", "value", "ord", "is_other")
WHERE "s"."slug" = 'fiscal-services'
  AND "q"."question_text" = 'What comprehensive fiscal services are you interested in?'
ON CONFLICT ("question_id", "value") DO NOTHING;

-- 3) Add hourly fiscal services multiselect (optional), if missing.
INSERT INTO "public"."service_questions" ("service_id", "question_text", "field_type", "is_required", "order_index")
SELECT "s"."id", 'What hourly fiscal services are you interested in?', 'multiselect', false, 4
FROM "public"."services" "s"
WHERE "s"."slug" = 'fiscal-services'
  AND NOT EXISTS (
      SELECT 1
      FROM "public"."service_questions" "q"
      WHERE "q"."service_id" = "s"."id"
        AND "q"."question_text" = 'What hourly fiscal services are you interested in?'
  );

INSERT INTO "public"."service_question_options" ("question_id", "label", "value", "order_index", "is_other")
SELECT "q"."id", "o"."label", "o"."value", "o"."ord", "o"."is_other"
FROM "public"."services" "s"
JOIN "public"."service_questions" "q" ON "q"."service_id" = "s"."id"
CROSS JOIN (
    VALUES
        (
            'Establishment of a Chart of Accounts (ongoing modifications)'::text,
            'Establishment of a Chart of Accounts (ongoing modifications)'::text,
            1,
            false
        ),
        (
            'Posting of receipts and disbursements from bank account'::text,
            'Posting of receipts and disbursements from bank account'::text,
            2,
            false
        ),
        (
            'Posting of credit card charges and reconciliation of monthly statement'::text,
            'Posting of credit card charges and reconciliation of monthly statement'::text,
            3,
            false
        ),
        (
            'Financial reporting to include: Profit & Loss, Profit & Loss Detail, Year-to-Date vs. Budget, Balance Sheet'::text,
            'Financial reporting to include: Profit & Loss, Profit & Loss Detail, Year-to-Date vs. Budget, Balance Sheet'::text,
            4,
            false
        ),
        (
            'Accounts Payable and Accounts Receivable (Pledges/Grants Receivable)'::text,
            'Accounts Payable and Accounts Receivable (Pledges/Grants Receivable)'::text,
            5,
            false
        ),
        (
            'Reconciliation of Bank, Brokerage, and third-party Accounts (PayPal, Stripe, etc.)'::text,
            'Reconciliation of Bank, Brokerage, and third-party Accounts (PayPal, Stripe, etc.)'::text,
            6,
            false
        ),
        (
            'Facilitation and administration of Fiscal Year-End Reporting'::text,
            'Facilitation and administration of Fiscal Year-End Reporting'::text,
            7,
            false
        ),
        ('Other'::text, 'Other'::text, 8, true)
) AS "o"("label", "value", "ord", "is_other")
WHERE "s"."slug" = 'fiscal-services'
  AND "q"."question_text" = 'What hourly fiscal services are you interested in?'
ON CONFLICT ("question_id", "value") DO NOTHING;

-- 4) Rename free-text explanation and keep it last.
UPDATE "public"."service_questions" "sq"
SET
    "question_text" = 'Please explain your financial situation and provide any details you feel are relevant to help us understand your needs.',
    "order_index" = 5
FROM "public"."services" "s"
WHERE "sq"."service_id" = "s"."id"
  AND "s"."slug" = 'fiscal-services'
  AND "sq"."question_text" IN (
      'Please Explain How We Can Help',
      'Please explain how we can help',
      'Please explain your financial situation and provide any details you feel are relevant to help us understand your needs.'
  );
