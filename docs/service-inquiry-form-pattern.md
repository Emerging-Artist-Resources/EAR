# Service Inquiry Form Pattern (Photography/Videography Reference)

This guide documents how `DocumentationInquiryForm` works today and turns that implementation into a repeatable pattern for future service forms.

Use this when you want to add another service page with a custom inquiry form that stores responses in Supabase and uses the same API + profile visibility flow.

---

## 1) End-to-end architecture

Current photography/videography flow:

1. Route page renders form component
   - `src/app/services/photography-videography/page.tsx`
2. Client form loads active service + questions from Supabase and renders dynamic fields
   - `src/components/services/DocumentationInquiryForm.tsx`
3. Form submits to API route
   - `POST /api/service-inquiries`
   - `src/app/api/service-inquiries/route.ts`
4. API validates payload, verifies questions, writes inquiry + answers, sends internal notification email
   - `src/lib/validations/service-inquiries.ts`
   - `src/lib/service-inquiries/validateAnswersAgainstQuestions.ts`
   - `src/lib/email/trySendServiceInquiryNotification.ts`
5. Signed-in users can later see submitted inquiry summaries in profile
   - `GET /api/profile/service-inquiries`
   - `src/app/api/profile/service-inquiries/route.ts`
   - `src/components/profile/activity/ServiceInquiriesSection.tsx`

---

## 2) Data model (Supabase)

Defined in:
- `supabase/migrations/20260407120000_service_inquiries.sql`

Tables:

- `services`
  - catalog of services (`slug`, `title`, `is_active`, etc.)
- `service_questions`
  - dynamic form definition per service
  - `field_type` supports: `text`, `textarea`, `select`, `date`, `time`, `multiselect`
- `service_inquiries`
  - one row per form submission
  - links to `services` and optional `user_id`
- `service_answers`
  - one row per question answer for each inquiry
  - unique by `(inquiry_id, question_id)`

Important behavior:

- Reads for active services/questions are allowed to `anon` + `authenticated` via RLS policy.
- Writes are performed by the API with the service-role client (`getSupabaseServiceClient`) rather than direct browser writes.
- Migration seeds the `documentation` service and default questions.

---

## 3) UI/form behavior pattern

Reference file:
- `src/components/services/DocumentationInquiryForm.tsx`

How it is set up:

- Client component (`"use client"`) because it uses state/effects and interactive inputs.
- On mount:
  - query `services` by `slug` + `is_active = true`
  - query `service_questions` by `service_id`, ordered by `order_index`
- Prefill:
  - if signed in, prefill `name` and `email` from `useAuth()`
- Dynamic rendering by `field_type`:
  - `textarea` -> `Textarea`
  - `text` / `date` / `time` -> `Input`
  - `select` -> native `<select>`
  - `multiselect` -> list of `Checkbox`
- Submission:
  - transform state into `{ question_id, answer_text }[]`
  - for multiselect, serialize selected values as JSON array string in `answer_text`
  - send via `apiPost("/api/service-inquiries", { service_slug, name, email, answers })`
- UX:
  - loading and load-error states before form render
  - submit loading state and toast success/error feedback
  - reset answer state after successful submit

---

## 4) API contract and validation pattern

Reference files:
- `src/app/api/service-inquiries/route.ts`
- `src/lib/validations/service-inquiries.ts`
- `src/lib/service-inquiries/validateAnswersAgainstQuestions.ts`

`POST /api/service-inquiries` request shape:

```json
{
  "service_slug": "documentation",
  "name": "Jane Artist",
  "email": "jane@example.com",
  "answers": [
    { "question_id": "uuid", "answer_text": "..." }
  ]
}
```

Validation layers:

1. Zod request-level validation (`service_slug`, `name`, `email`, answer shape and lengths).
2. Server-side service lookup (`slug` must exist and be active).
3. Question set lookup from DB for that service.
4. Answer-to-question validation:
   - reject unknown `question_id`
   - enforce required answers by field type
   - treat empty multiselect (`[]`) as missing when required

Persistence pattern:

1. Insert one `service_inquiries` row.
2. Insert one `service_answers` row per question.
3. Build HTML summary and attempt notification email (non-fatal if email fails).
4. Return `201` with inquiry id via `createSuccessResponse`.

---

## 5) Options pattern (current implementation detail)

Reference file:
- `src/lib/service-inquiries/documentation-options.ts`

Today, option values for select/multiselect are hardcoded in code and selected by question text + field type.

This works for one service, but for scale you should consider adding a `question_options` table and loading options from DB to avoid hardcoded branching per form.

---

## 6) Repeatable checklist for a new service form

Use this sequence for new forms (for example: lighting, rehearsal support, etc.):

1. **Add/seed service + questions in migration**
   - add service row in `services`
   - add ordered `service_questions` rows with valid `field_type`
2. **Create options source**
   - short-term: add a new file under `src/lib/service-inquiries/*-options.ts`
   - long-term: move to DB-backed options
3. **Create form component**
   - copy structure from `DocumentationInquiryForm`
   - update service slug constant and option-selection logic
   - keep `name`/`email` prefill and toast/error states
4. **Create service page route**
   - page imports and renders the new form component
5. **Reuse shared API route**
   - no new API endpoint needed if payload matches `POST /api/service-inquiries`
6. **Verify profile visibility**
   - signed-in submission should appear in `ServiceInquiriesSection`
7. **Verify admin email notifications**
   - ensure env vars are present (`ADMIN_EMAIL` or `ADMIN_NOTIFICATION_EMAIL`, Postmark vars)

---

## 7) Testing checklist (manual)

- Unauthenticated user can load active service questions and submit.
- Authenticated user sees prefilled name/email and inquiry appears in profile activity.
- Required fields are enforced for each field type.
- Multiselect required question rejects empty array.
- Invalid/unknown `question_id` is rejected by API.
- New inquiry creates:
  - one `service_inquiries` row
  - `N` `service_answers` rows for `N` questions
- Internal email sends when email env config is present.

---

## 8) Suggested future improvements for easier reuse

- Build a generic `ServiceInquiryForm` component that accepts only `serviceSlug` + optional copy overrides.
- Move select/multiselect options into database (`question_options`) to remove hardcoded logic by question text.
- Add form-level telemetry/logging for failed submissions.
- Add integration tests for `POST /api/service-inquiries` required-answer edge cases.

