# Service Inquiry Form Pattern

This guide documents the shared inquiry layout and how service-specific forms plug into it.

Use this when you want to add another service inquiry that stores responses in Supabase and uses the same API + profile visibility flow.

## Shared layout (standard chrome)

- `src/components/forms/service-inquiry/ServiceInquiryLayout.tsx` — page chrome, nav strip, title, optional step dots, native `<form>`, card, footer actions
- `src/components/forms/service-inquiry/ServiceInquirySuccessScreen.tsx` — success state driven by `ServiceInquiryContent`
- `src/components/forms/service-inquiry/inquiry-layout-spacing.ts` — canonical spacing tokens
- `src/lib/service-inquiries/inquiry-content-types.ts` — `ServiceInquiryContent` contract
- `src/hooks/use-service-inquiry-auth-prefill.ts` — first/last name + email prefill
- `src/hooks/use-service-inquiry-form-errors.ts` — first error message, error banner, focus first invalid field

**Layout rules:**

- Step indicator only when `totalPages > 1`
- Wizard **Back** only when `currentPage > 1` (hidden on page 1, not disabled)
- Service nav link in a full-width strip under the site header (left-aligned, same max width as the site header)
- Form title centered in the page column below the nav strip
- Card + footer wrapped in a native `<form>` so Enter submits (Continue on wizard steps, Submit inquiry on the last page)
- Field spacing inside steps uses `inquiryLayoutSpacing` tokens (`cardInner`, `fieldGrid`, `section`, `stepSectionGroups`) — avoid ad-hoc `space-y-*` in inquiry forms

**Reference implementations:**

- Multi-step: `src/components/forms/fiscal-sponsorship-inquiry/FiscalSponsorshipInquiryForm.tsx`
- Single-page + DB questions: `ServiceInquiryForm` / `DocumentationInquiryForm.tsx` (wrapper)

**Content config (`ServiceInquiryContent`):**

- Per-service file under `src/lib/*-inquiry-content.ts` (success copy, optional `formTitle`, optional `steps`)
- **Multi-step wizard step titles/descriptions:** define `steps` on the content object (source of truth). Derive page metadata in `*-form-config.ts` from that array — do not duplicate step copy in form-config (see `fiscalSponsorshipInquiryContent.steps` → `fiscalSponsorshipInquiryPages`).

**Validation feedback:**

- Use `useServiceInquiryFormErrors` with an ordered `fieldOrder` (and optional Zod `schema` + `nestedErrorRoots` for dynamic `answers` records).
- On failed submit/continue: `reportValidationFailure(setShowErrorSummary, showToast)` sets the banner, toasts the first message, and focuses the first invalid field.

---


## 1) End-to-end architecture

Current photography/videography flow:

1. Route page renders form component
   - `src/app/services/photography-videography/page.tsx`
2. Client form loads active service + questions from Supabase and renders dynamic fields
   - `src/components/forms/documentation-inquiry/DocumentationInquiryForm.tsx`
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

Reference files:
- `src/components/forms/documentation-inquiry/DocumentationInquiryForm.tsx`
- `src/components/forms/documentation-inquiry/DocumentationInquiryFields.tsx`

How documentation inquiry is set up:

- Wrapped in `ServiceInquiryLayout` (`totalPages={1}` — no step dots, no wizard Back).
- Contact: `firstName`, `lastName`, `email` via `TextField` + `useServiceInquiryAuthPrefill`.
- On mount: load `services` + `service_questions` from Supabase.
- Dynamic questions: map known `field_type` values to owned blocks (`TextField`, `TextAreaField`, `SelectBlock`) — **not** a full metadata-driven renderer.
- Options from `src/lib/service-inquiries/documentation-options.ts`.
- Validation: `src/lib/validations/documentation-inquiry.ts` (Zod + required-answer refine).
- Submit: `name` = `firstName` + `lastName`; multiselect answers as JSON array strings.
- Success: `ServiceInquirySuccessScreen` + `src/lib/documentation-inquiry-content.ts`.

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

## 5) Options pattern (`service_question_options`)

Migration: `supabase/migrations/20260516140000_service_question_options.sql`

- Table `service_question_options` — `label`, `value`, `order_index`, `is_other` per `service_questions` row
- Loaded with questions via `loadServiceInquiryQuestions()` (nested Supabase select)
- Helpers in `src/lib/service-inquiries/service-inquiry-questions.ts` (`sortedOptionLabels`, `questionOptionsIncludeOther`, answer encoding)

Seed select/multiselect options in migrations when adding a new service. Per-field helper copy (e.g. budget note) can stay in service-specific `*-options.ts` files until moved to DB.

---

## 6) Repeatable checklist for a new service form

Use this sequence for new forms (for example: lighting, rehearsal support, etc.):

1. **Add/seed service + questions in migration**
   - add service row in `services`
   - add ordered `service_questions` rows with valid `field_type`
2. **Seed `service_question_options`** for any select/multiselect questions
3. **Create form component**
   - **Single-page + DB questions:** use `ServiceInquiryForm` with `serviceSlug` + `ServiceInquiryContent` (see documentation wrapper)
   - **Multi-step / custom fields:** use `ServiceInquiryLayout` + step components (fiscal sponsorship)
   - Optional: `questionNote`, `partitionQuestions`, section titles on `ServiceInquiryForm`
4. **Create service page route**
   - page imports and renders the new form component
5. **Reuse shared API route**
   - no new API endpoint needed if payload matches `POST /api/service-inquiries`
6. **Verify profile visibility**
   - signed-in submission should appear in `ServiceInquiriesSection`
7. **Verify email notifications**
   - **Documentation / fiscal sponsorship:** Postmark templated emails + PDF (`documentation-inquiry-*` or `fiscal-sponsorship-inquiry-*` templates — see `docs/postmark-*-inquiry-templates.md`)
   - **Other services:** simple admin HTML via `trySendServiceInquiryNotification`
   - Env: `ADMIN_EMAIL` or `ADMIN_NOTIFICATION_EMAIL`, `POSTMARK_SERVER_TOKEN`, `POSTMARK_FROM_NAME`, `POSTMARK_FROM_EMAIL`

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
- Documentation/fiscal: admin + submitter Postmark emails with PDF when env config is present.
- Other services: admin HTML email when env config is present.

---

## 8) Generic single-page shell

`src/components/forms/service-inquiry/ServiceInquiryForm.tsx` — pass:

- `serviceSlug`, `content` (`ServiceInquiryContent`), nav labels (`backHref`, `backLabel`, `successBackLabel`)
- Optional: `title`, `questionNote`, `partitionQuestions`, section titles

Example wrapper: `DocumentationInquiryForm` → thin config over `ServiceInquiryForm`.

Underlying pieces: `loadServiceInquiryQuestions`, `DynamicServiceInquiryFields`, `buildDynamicServiceInquirySchema`, `buildServiceInquiryAnswers`.

## 9) Suggested future improvements

- Add form-level telemetry/logging for failed submissions.
- Add integration tests for `POST /api/service-inquiries` required-answer edge cases.
- Move per-field `questionNote` copy into DB (`help_text` on `service_questions`) when needed.

