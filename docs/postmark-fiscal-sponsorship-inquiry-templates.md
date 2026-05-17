# Postmark templates: Fiscal sponsorship inquiry

Create two **Server templates** in Postmark with these **aliases** (must match exactly):

| Alias | Recipient |
|-------|-----------|
| `fiscal-sponsorship-inquiry-admin` | `ADMIN_EMAIL` or `ADMIN_NOTIFICATION_EMAIL` |
| `fiscal-sponsorship-inquiry-confirmation` | Submitter email |

Both emails include a PDF attachment with the full inquiry (all form fields, matching the 3-page online form).

**Sender:** `{{POSTMARK_FROM_NAME}} <{{POSTMARK_FROM_EMAIL}}>` (configured in env).

---

## Template variables (both templates)

| Variable | Description |
|----------|-------------|
| `{{first_name}}` | First name parsed from submitter name (or full name if single word) |
| `{{submitter_name}}` | Full name from inquiry |
| `{{submitter_email}}` | Submitter email |
| `{{inquiry_id}}` | UUID of `service_inquiries` row |
| `{{submitted_date}}` | Long-form submission timestamp |
| `{{artist_project_name}}` | Answer to “Artist, Project, or Organization Name” |
| `{{is_admin}}` | `"yes"` on admin template only; empty on confirmation (optional; for conditional blocks) |

---

## 1. Admin — `fiscal-sponsorship-inquiry-admin`

**Subject:**

```
New fiscal sponsorship inquiry from {{submitter_name}}
```

**HTML body:**

```html
<h2>New fiscal sponsorship inquiry</h2>

<p>A new fiscal sponsorship inquiry was submitted on {{submitted_date}}.</p>

<p>
  <strong>Name:</strong> {{submitter_name}}<br />
  <strong>Email:</strong> {{submitter_email}}<br />
  <strong>Artist / project / organization:</strong> {{artist_project_name}}<br />
  <strong>Inquiry ID:</strong> {{inquiry_id}}
</p>

<p>
  A PDF copy of the full inquiry form is attached. It includes all questions and answers
  in the same order as the online form (contact information, organization &amp; discipline,
  and sponsorship needs).
</p>

<p style="color:#666;font-size:13px;">
  Emerging Artist Resources — internal notification
</p>
```

**Text body (optional fallback):**

```
New fiscal sponsorship inquiry

Submitted: {{submitted_date}}

Name: {{submitter_name}}
Email: {{submitter_email}}
Artist / project / organization: {{artist_project_name}}
Inquiry ID: {{inquiry_id}}

A PDF with the complete inquiry responses is attached.
```

---

## 2. Confirmation — `fiscal-sponsorship-inquiry-confirmation`

**Subject:**

```
We received your fiscal sponsorship inquiry
```

**HTML body:**

```html
<p>Hi {{first_name}},</p>

<p>
  Thank you for submitting a fiscal sponsorship inquiry to Emerging Artist Resources.
  We received your responses on {{submitted_date}}.
</p>

<p>
  Our team will review your inquiry and reply by email within <strong>5–7 business days</strong>.
  If you have questions in the meantime, contact us at
  <a href="mailto:info@eararts.org">info@eararts.org</a>.
</p>

<p>
  <strong>Your reference ID:</strong> {{inquiry_id}}<br />
  <strong>Artist / project / organization:</strong> {{artist_project_name}}
</p>

<p>
  A PDF copy of your submitted inquiry is attached for your records. It lists every
  question and answer exactly as you entered them on the form.
</p>

<p>Thank you,<br />Emerging Artist Resources</p>
```

**Text body (optional fallback):**

```
Hi {{first_name}},

Thank you for your fiscal sponsorship inquiry. We received it on {{submitted_date}}.

We will review your inquiry and respond by email within 5-7 business days.
Questions? Email info@eararts.org.

Reference ID: {{inquiry_id}}
Artist / project / organization: {{artist_project_name}}

A PDF copy of your full inquiry is attached.

Thank you,
Emerging Artist Resources
```

---

## PDF attachment

- **Filename pattern:** `Fiscal-Sponsorship-Inquiry-{Name}-{YYYY-MM-DD}.pdf`
- **Contents:** Three sections aligned with the web form:
  1. Page 1 — Contact information (first/last name from submitter name, email, pronouns, org name, website, location)
  2. Page 2 — Organization & discipline
  3. Page 3 — Sponsorship needs

---

## Environment

Same as other Postmark flows:

```bash
POSTMARK_SERVER_TOKEN=...
POSTMARK_FROM_NAME=EAR
POSTMARK_FROM_EMAIL=no-reply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com   # or ADMIN_NOTIFICATION_EMAIL
DISABLE_EMAILS=false               # set true to skip sends in dev
```

**Code:** `trySendFiscalSponsorshipInquiryEmails` in `src/lib/email/trySendFiscalSponsorshipInquiryEmails.ts`, invoked from `POST /api/service-inquiries` when `service_slug` is `fiscal-sponsorship`.
