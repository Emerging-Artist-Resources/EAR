# Postmark templates: Fiscal services inquiry

Create two **Server templates** in Postmark with these **aliases** (must match exactly):

| Alias | Recipient |
|-------|-----------|
| `fiscal-service-inquiry-admin` | `ADMIN_EMAIL` or `ADMIN_NOTIFICATION_EMAIL` |
| `fiscal-service-inquiry-confirmation` | Submitter email |

Both emails include a PDF attachment with the full inquiry (contact information + fiscal services).

**Sender:** `{{POSTMARK_FROM_NAME}} <{{POSTMARK_FROM_EMAIL}}>` (configured in env).

---

## Template variables (both templates)

| Variable | Description |
|----------|-------------|
| `{{first_name}}` | Greeting name: first token if multi-word, else full name, else `there` |
| `{{submitter_name}}` | Full name from inquiry |
| `{{submitter_email}}` | Submitter email |
| `{{inquiry_id}}` | UUID of `service_inquiries` row |
| `{{submitted_date}}` | Long-form submission timestamp |
| `{{is_admin}}` | `"yes"` on admin template only; empty on confirmation (optional) |

---

## 1. Admin — `fiscal-service-inquiry-admin`

**Subject:**

```
New fiscal service inquiry from {{submitter_name}}
```

**HTML body:**

```html
<h2>New fiscal service inquiry</h2>

<p>A new fiscal service inquiry was submitted on {{submitted_date}}.</p>

<p>
  <strong>Name:</strong> {{submitter_name}}<br />
  <strong>Email:</strong> {{submitter_email}}<br />
  <strong>Inquiry ID:</strong> {{inquiry_id}}
</p>

<p>
  A PDF copy of the full inquiry form is attached. It includes all questions and answers
  in the same order as the online form (contact information and fiscal services).
</p>

<p style="color:#666;font-size:13px;">
  Emerging Artist Resources — internal notification
</p>
```

---

## 2. Confirmation — `fiscal-service-inquiry-confirmation`

**Subject (suggested):**

```
We received your fiscal services inquiry
```

**HTML body:**

```html
<p>Hi {{first_name}},</p>

<p>
  Thank you for submitting a fiscal service inquiry to Emerging Artist Resources.
  We received your responses on {{submitted_date}}.
</p>

<p>
  Our team will review your inquiry and reply by email within <strong>2–5 business days</strong>.
  If you have questions in the meantime, contact us at
  <a href="mailto:info@eararts.org">info@eararts.org</a>.
</p>

<p>
  <strong>Your reference ID:</strong> {{inquiry_id}}<br />
</p>

<p>
  A PDF copy of your submitted inquiry is attached for your records.
</p>

<p>Thank you,<br />Emerging Artist Resources</p>
```

---

## PDF attachment

- **Filename pattern:** `Fiscal-Service-Inquiry-{Name}-{YYYY-MM-DD}.pdf`
- **Title on PDF:** Fiscal Services Inquiry

---

## Environment

Same as other Postmark flows:

```
POSTMARK_SERVER_TOKEN=...
POSTMARK_FROM_NAME=EAR
POSTMARK_FROM_EMAIL=no-reply@yourdomain.com
ADMIN_EMAIL=...   # or ADMIN_NOTIFICATION_EMAIL
```

Optional: `DISABLE_EMAILS=true` skips sending (inquiry still saved).
