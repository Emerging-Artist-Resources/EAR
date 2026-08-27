# Postmark template: Donation page updated (admin)

Create one **Server template** in Postmark with this **alias** (must match exactly):

| Alias | Recipient |
|-------|-----------|
| `donation-page-updated-admin` | `ADMIN_EMAIL` or `ADMIN_NOTIFICATION_EMAIL` |

Admin-only. No email is sent to the user who saved the page. No PDF attachment.

**Sender:** `{POSTMARK_FROM_NAME} <{POSTMARK_FROM_EMAIL}>` (configured in env).

**When sent:** After a successful `PATCH /api/profile/donation-page` when donation page settings actually changed (approved fiscal sponsorship recipient). No-op saves skip email.

**Implementation:** `sendDonationPageUpdatedAdminEmail` in `src/features/profile/server/service.ts` → `sendProfileEmail("donation-page-updated-admin")`. Model built by `buildDonationPageUpdatedAdminTemplateModel`.

---

## Template variables

| Variable | Description |
|----------|-------------|
| `{{user_name}}` | Recipient display name from profile |
| `{{user_email}}` | Auth email of the user who saved |
| `{{profile_type}}` | Profile type (individual, company, etc.) |
| `{{organization_name}}` | Organization name when applicable (may be empty) |
| `{{slug}}` | Public donation slug |
| `{{donation_page_url}}` | Absolute URL to `/donate/{slug}` |
| `{{has_image}}` | `"yes"` or `"no"` |
| `{{donation_page_message}}` | Saved page message (may be empty) |
| `{{preset_amounts}}` | Comma-separated preset dollar amounts |
| `{{designation_enabled}}` | `"yes"` or `"no"` |
| `{{designation_field_label}}` | Designation field label when enabled (else empty) |
| `{{designation_options}}` | Comma-separated option labels when enabled (else empty) |

---

## Admin — `donation-page-updated-admin`

**Subject:**

```
Donation page updated: {{user_name}}
```

**HTML body:**

```html
<h2>Donation page updated</h2>

<p>
  <strong>{{user_name}}</strong> ({{user_email}}) updated their public donation page.
</p>

<p>
  <strong>Profile type:</strong> {{profile_type}}<br />
  <strong>Organization:</strong> {{organization_name}}<br />
  <strong>Slug:</strong> {{slug}}<br />
  <strong>Public page:</strong> <a href="{{donation_page_url}}">{{donation_page_url}}</a>
</p>

<h3>Current settings</h3>
<p>
  <strong>Hero image:</strong> {{has_image}}<br />
  <strong>Preset amounts:</strong> {{preset_amounts}}<br />
  <strong>Designation enabled:</strong> {{designation_enabled}}<br />
  <strong>Designation label:</strong> {{designation_field_label}}<br />
  <strong>Designation options:</strong> {{designation_options}}
</p>

<p>
  <strong>Message:</strong><br />
  {{donation_page_message}}
</p>

<p style="color:#666;font-size:13px;">
  Emerging Artist Resources — internal notification
</p>
```

**Text body (optional fallback):**

```
Donation page updated

Name: {{user_name}}
Email: {{user_email}}
Profile type: {{profile_type}}
Organization: {{organization_name}}
Slug: {{slug}}
Public page: {{donation_page_url}}

Hero image: {{has_image}}
Preset amounts: {{preset_amounts}}
Designation enabled: {{designation_enabled}}
Designation label: {{designation_field_label}}
Designation options: {{designation_options}}

Message:
{{donation_page_message}}
```

---

## Environment

```bash
ADMIN_EMAIL=admin@yourdomain.com   # or ADMIN_NOTIFICATION_EMAIL (ADMIN_EMAIL wins if both set)
POSTMARK_SERVER_TOKEN=...
POSTMARK_FROM_NAME=EAR
POSTMARK_FROM_EMAIL=no-reply@yourdomain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

Until this template exists in Postmark, sends will fail at the API; the donation page PATCH still succeeds (errors are logged and swallowed).
