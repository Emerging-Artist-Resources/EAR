-- Fiscal sponsorship service inquiry + stable question_key mapping

ALTER TABLE "public"."service_questions"
    ADD COLUMN IF NOT EXISTS "question_key" text;

CREATE UNIQUE INDEX IF NOT EXISTS "service_questions_service_id_question_key_idx"
    ON "public"."service_questions" ("service_id", "question_key")
    WHERE "question_key" IS NOT NULL;

INSERT INTO "public"."services" ("slug", "title", "description", "is_active")
VALUES (
    'fiscal-sponsorship',
    'Fiscal Sponsorship',
    'Inquiry form for fiscal sponsorship with Emerging Artist Resources.',
    true
)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "public"."service_questions" (
    "service_id",
    "question_key",
    "question_text",
    "field_type",
    "is_required",
    "order_index"
)
SELECT s."id", x."qk", x."q", x."ft", x."req", x."ord"
FROM "public"."services" s
CROSS JOIN (
    VALUES
        ('pronouns'::text, 'Pronouns'::text, 'text'::text, false, 1),
        ('artist_project_name'::text, 'Artist, Project, or Organization Name'::text, 'text'::text, true, 2),
        ('website_social_portfolio'::text, 'Website / Social Media / Portfolio'::text, 'text'::text, false, 3),
        ('location_based'::text, 'Where are you based?'::text, 'text'::text, true, 4),
        ('entity_type'::text, 'What type of entity are you?'::text, 'select'::text, true, 5),
        ('artistic_discipline'::text, 'Artistic Discipline'::text, 'multiselect'::text, true, 6),
        ('project_description'::text, 'Please describe your project or organization'::text, 'textarea'::text, false, 7),
        ('annual_budget'::text, 'What is your estimated annual project budget?'::text, 'select'::text, true, 8),
        ('why_seeking'::text, 'Why are you seeking fiscal sponsorship?'::text, 'multiselect'::text, true, 9),
        ('expected_services'::text, 'Which services would you expect from a fiscal sponsor?'::text, 'multiselect'::text, true, 10),
        ('legal_entity'::text, 'Do you currently have a legal entity?'::text, 'select'::text, true, 11),
        ('previous_fiscal_sponsor'::text, 'Have you previously worked with a fiscal sponsor?'::text, 'select'::text, true, 12),
        ('previous_fiscal_sponsor_org'::text, 'If yes, which organization?'::text, 'text'::text, false, 13),
        ('additional_services_interest'::text, 'Are you interested in additional fiscal services (bookkeeping, grant writing, fiscal mentorship, etc.)?'::text, 'select'::text, true, 14),
        ('how_heard'::text, 'How did you hear about us?'::text, 'select'::text, false, 15),
        ('anything_else'::text, 'Is there anything else you''d like to share about your organization/project?'::text, 'textarea'::text, false, 16)
) AS x("qk", "q", "ft", "req", "ord")
WHERE s."slug" = 'fiscal-sponsorship'
  AND NOT EXISTS (
      SELECT 1 FROM "public"."service_questions" q WHERE q."service_id" = s."id"
  );
