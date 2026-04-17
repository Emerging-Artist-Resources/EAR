# Service Inquiry Form Agent Prompt Template

Copy this prompt into an agent chat, fill in the placeholders, and keep the linked pattern doc attached.

---

## Copy/Paste Prompt

You are implementing a new service inquiry form in the `performance-calendar` app.

Follow this pattern doc exactly:
- `docs/service-inquiry-form-pattern.md`

### Goal

Create a new service inquiry flow for:
- Service slug: `<SERVICE_SLUG>`
- Service title: `<SERVICE_TITLE>`
- Route path: `/services/<ROUTE_SEGMENT>`
- Page heading/subcopy:
  - Heading: `<PAGE_HEADING>`
  - Subcopy: `<PAGE_SUBCOPY>`

### Requirements

1. Reuse the existing `POST /api/service-inquiries` endpoint unless there is a hard blocker.
2. Use the same architecture as the documentation inquiry pattern:
   - page route under `src/app/services/.../page.tsx`
   - client form component under `src/components/services/...`
   - options module under `src/lib/service-inquiries/...-options.ts`
   - migration seed for `services` + `service_questions`
3. Keep behavior consistent:
   - load active service + ordered questions from Supabase
   - render fields by `field_type`
   - serialize `multiselect` as JSON array string
   - submit `{ service_slug, name, email, answers }`
   - toast success/error and reset form state on success
4. Keep code style aligned with existing files and shared utilities (`apiPost`, `useToast`, `useAuth`, `cn`).
5. Do not break existing service inquiry flows.

### New Question Spec

Create/seed these questions exactly as listed below.
Each question must include:
- `question_text`
- `field_type` (`text | textarea | select | date | time | multiselect`)
- `is_required` (boolean)
- `order_index` (integer, starts at 1)
- `options` (required for select/multiselect)

Questions:

```yaml
service:
  slug: "<SERVICE_SLUG>"
  title: "<SERVICE_TITLE>"
  description: "<SERVICE_DESCRIPTION>"
  is_active: true

questions:
  - order_index: 1
    question_text: "<QUESTION_1_TEXT>"
    field_type: "text"
    is_required: false

  - order_index: 2
    question_text: "<QUESTION_2_TEXT>"
    field_type: "multiselect"
    is_required: true
    options:
      - "<OPTION_A>"
      - "<OPTION_B>"
      - "<OPTION_C>"

  - order_index: 3
    question_text: "<QUESTION_3_TEXT>"
    field_type: "select"
    is_required: true
    options:
      - "<OPTION_1>"
      - "<OPTION_2>"

  - order_index: 4
    question_text: "<QUESTION_4_TEXT>"
    field_type: "date"
    is_required: true

  - order_index: 5
    question_text: "<QUESTION_5_TEXT>"
    field_type: "time"
    is_required: true

  - order_index: 6
    question_text: "<QUESTION_6_TEXT>"
    field_type: "textarea"
    is_required: false
```

### Deliverables

Implement all required code changes and then provide:

1. **Files changed** with a short reason for each.
2. **How the data flows** from UI to DB for this service.
3. **Manual test checklist** with expected results.
4. Any assumptions made.

### Validation Checklist (must pass)

- New page renders and form loads questions.
- Required fields enforce correctly.
- Select/multiselect options match the question spec.
- Submit succeeds and creates:
  - one `service_inquiries` row
  - one `service_answers` row per question
- Signed-in submissions appear in profile service inquiries.
- Existing documentation form still works.

---

## Notes For Reuse

- If you only change questions/options for an existing service, you can skip creating a new route/component and update migration + options mapping only.
- If you want multiple services to share one generic form component, tell the agent explicitly; otherwise it will likely follow the one-component-per-service pattern from the reference.
