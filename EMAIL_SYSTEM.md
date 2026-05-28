# Email System Documentation

## Overview

The email system uses Postmark for transactional emails. It's designed to send automated emails to users when certain events occur (e.g., listing submissions, updates).

## Architecture

### File Structure

```
src/lib/email/
├── postmark.ts                         # Postmark client initialization
├── sendListingEmail.ts               # Listing-specific email functions
├── sendProfileEmail.ts               # Profile-specific email functions
├── sendInternalDonationEmail.ts      # Donation artist/admin templates + PDF attachment
├── trySendInternalDonationNotifications.ts  # Stripe webhook: idempotent internal donation sends
├── sendFiscalSponsorshipInquiryEmail.ts   # Fiscal sponsorship inquiry templates + PDF attachment
├── sendDocumentationInquiryEmail.ts       # Documentation inquiry templates + PDF attachment
├── sendFiscalServicesInquiryEmail.ts      # Fiscal services inquiry templates + PDF attachment
├── trySendFiscalSponsorshipInquiryEmails.ts # service-inquiries API: fiscal sponsorship
├── trySendDocumentationInquiryEmails.ts   # service-inquiries API: documentation
└── trySendFiscalServicesInquiryEmails.ts  # service-inquiries API: fiscal services
```

### Components

1. **Postmark Client** (`postmark.ts`)
   - Initializes the Postmark ServerClient
   - Requires `POSTMARK_TRANSACTIONAL_TOKEN` environment variable

2. **Email Functions** (`sendListingEmail.ts`, `sendProfileEmail.ts`)
   - Type-safe email sending for listing and profile-related events
   - Uses Postmark template aliases
   - Handles template variable mapping

3. **Service Layer** (`features/events/server/service.ts`, `features/profile/server/service.ts`)
   - Business logic for sending emails after events
   - Extracts data needed for emails
   - Called from API routes and server actions

## Setup

### 1. Environment Variables

Add to your `.env.local` or deployment environment:

```bash
POSTMARK_TRANSACTIONAL_TOKEN=your_postmark_server_token
POSTMARK_FROM_NAME=EAR  # Required: Display name for sender
POSTMARK_FROM_EMAIL=no-reply@yourdomain.com  # Required: Must be verified in Postmark
NEXT_PUBLIC_APP_URL=https://your-domain.com  # Used for email links
```

**Email Pattern:**
The email will be sent using the format: `{POSTMARK_FROM_NAME} <{POSTMARK_FROM_EMAIL}>`

**Example:**
- `POSTMARK_FROM_NAME=EAR`
- `POSTMARK_FROM_EMAIL=no-reply@earplatform.org`
- Result: Emails appear from `EAR <no-reply@earplatform.org>`

**Important:** 
- Both `POSTMARK_FROM_NAME` and `POSTMARK_FROM_EMAIL` are **required**
- The `POSTMARK_FROM_EMAIL` address must be verified as a Sender Signature in Postmark
- See step 2 below for Sender Signature setup

### 2. Postmark Account Setup

1. Create a Postmark account at https://postmarkapp.com
2. Create a Server in Postmark
3. Copy the Server API Token to `POSTMARK_TRANSACTIONAL_TOKEN`
4. **Add and Verify Sender Signature** (CRITICAL):
   - Go to Postmark Dashboard → Sender Signatures
   - Click "Add Signature" or "Verify a domain"
   - Add the email address you want to use (e.g., `no-reply@earplatform.org`)
   - Complete the domain verification process (add DNS records)
   - Wait for verification to complete (usually a few minutes)
   - Set `POSTMARK_FROM_EMAIL` to match your verified address
   - Set `POSTMARK_FROM_NAME` to your desired display name (e.g., "EAR")
   
   **Note:** The email will be sent as `{POSTMARK_FROM_NAME} <{POSTMARK_FROM_EMAIL}>`
   
   **Example:** If `POSTMARK_FROM_NAME=EAR` and `POSTMARK_FROM_EMAIL=no-reply@earplatform.org`, 
   emails will appear from: `EAR <no-reply@earplatform.org>`

### 3. Create Email Templates in Postmark

For each email type, create a template in Postmark with the corresponding alias:

#### Template: `listing-received`
- **Alias**: `listing-received`
- **Subject**: Your listing has been received
- **Template Variables**:
  - `{{submitter_name}}` - Name of the person who submitted
  - `{{listing_title}}` - Title of the listing
  - `{{cta_url}}` - Link to view the listing in dashboard

#### Template: `listing-updated`
- **Alias**: `listing-updated`
- **Subject**: Your listing has been updated
- **Template Variables**:
  - `{{submitter_name}}` - Name of the person who submitted
  - `{{listing_title}}` - Title of the listing
  - `{{cta_url}}` - Link to view the listing in dashboard

#### Template: `listing-share-festival`
- **Alias**: `listing-share-festival`
- **Subject**: (configure in Postmark, e.g. someone shared an EAR performance listing with you)
- **When sent**: After an **approved** performance listing with `performance_details.subtype = ORGANIZER` is approved, once per listing (see idempotency below).
- **Template Variables**:
  - `{{listing_title}}` - Title of the listing
  - `{{public_calendar_url}}` - Deep link to the public calendar (`/calendar?listingId=...`, uses `getPublicAppUrl()`)
  - `{{inviter_name}}` - Submitter / contact name
  - `{{inviter_email}}` - Submitter contact email
  - `{{platform_name}}` - `EAR` (literal from code; use in body for context)

#### Template: `listing-share-piece`
- **Alias**: `listing-share-piece`
- **Subject**: (configure in Postmark, e.g. invitation to join a performance listing on EAR)
- **When sent**: After an **approved** performance listing with `performance_details.subtype = PIECE` is approved, once per listing. Recipients are organizer/presenter emails from the participating-artist “Invite the organizer or presenter” field (`meta.share.recipient_emails`).
- **Suggested body** (configure in Postmark; variables below):

  > Dear Artist,  
  > {{company_artist_name}} has invited you to join the performance listing for {{event_title}} on Emerging Artist Resources’ Community Calendar.  
  > You can use the link below to submit your listing. To ensure the listings are properly connected, please submit as the Primary Lister.  
  > If you have any questions, please feel free to contact us at {{support_email}}.  
  > {{submit_listing_url}}  
  > Best,  
  > Emerging Artist Resources

- **Template Variables**:
  - `{{company_artist_name}}` - Piece company, then choreographer, then submitter contact name
  - `{{event_title}}` - Parent event name (manual), else linked parent listing title, else piece performance title, else `this performance`
  - `{{submit_listing_url}}` - `${getPublicAppUrl()}/forms` (submit listing)
  - `{{support_email}}` - `info@eararts.org`

**Share list storage:** Recipient addresses live in `listings.meta.share.recipient_emails` (max 10, normalized server-side: trim, lowercase, dedupe, submitter excluded). **`meta.share.sent_at`** is set by the server after the first share batch attempt so re-approval does not resend. Clients cannot set `sent_at` via API. Public listing reads do not expose `meta`.

**Implementation:** `sendListingShareEmailsAfterApproval()` in `src/features/events/server/service.ts`, invoked from `approveListingRepo` in `src/features/events/server/admin-review.ts` after the submitter approval email. Low-level send: `src/lib/email/sendListingShareEmail.ts`.

#### Template: `admin-new-user`
- **Alias**: `admin-new-user`
- **Subject**: New user signup: {{user_email}}
- **Template Variables**:
  - `{{user_name}}` - Primary contact name (or full name for individuals)
  - `{{user_email}}` - Email address of the new user
  - `{{profile_type}}` - Type of profile (individual, company, festival, other)
  - `{{organization_name}}` - Organization name when applicable (may be empty for individuals)
  - `{{cta_url}}` - Link to admin dashboard to review profile

#### Template: `profile-approved`
- **Alias**: `profile-approved`
- **Subject**: Your EAR profile has been approved
- **Template Variables**:
  - `{{first_name}}` - First name of the user (extracted from full name)
  - `{{user_name}}` - Full name of the user
  - `{{cta_url}}` - Link to user dashboard

#### Template: `email-confirmation`
- **Alias**: `email-confirmation`
- **Subject**: Confirm your EAR account
- **Template Variables**:
  - `{{first_name}}` - First name of the user (extracted from full name)
  - `{{verification_url}}` - Link to verify email address (generated by Supabase)

#### Template: `password-reset`
- **Alias**: `password-reset`
- **Subject**: Reset your EAR password
- **Template Variables**:
  - `{{first_name}}` - First name of the user (extracted from full name)
  - `{{reset_url}}` - Link generated by Supabase for password recovery

#### Template: `donation-notification-artist`
- **Alias**: `donation-notification-artist`
- **Subject**: (configured in Postmark, e.g. new donation notice to the artist)
- **Attachment**: PDF summary generated server-side (`Donation-{artist}-{YYYY-MM-DD}.pdf`, sanitized artist segment)
- **Template Variables**:
  - `{{artist_name}}` - Recipient display name (snapshot) or fallback
  - `{{donor_name}}` - Donor display name
  - `{{amount}}` - Formatted decimal string (e.g. `12.34`); template may prefix `$`
  - `{{date}}` - Long-form date (matches Stripe-settlement-style formatting used in code)
  - `{{message}}` - Optional donor message (use conditional block in template if present)

#### Template: `donation-notification-admin`
- **Alias**: `donation-notification-admin`
- **Subject**: e.g. `New donation received for {{artist_name}}`
- **Attachment**: Same PDF as artist email
- **Template Variables**:
  - `{{artist_name}}` - Artist/recipient label, or `EAR` for non-artist-specific (general) donations
  - `{{donor_name}}`, `{{donor_email}}`, `{{amount}}`, `{{date}}`, optional `{{message}}`

**Admin inbox env:** `ADMIN_NOTIFICATION_EMAIL` or `ADMIN_EMAIL` (if both are set, `ADMIN_EMAIL` wins). At least one must be set for admin notifications to send.

#### Template: `fiscal-sponsorship-inquiry-admin`
- **Alias**: `fiscal-sponsorship-inquiry-admin`
- **Subject**: `New fiscal sponsorship inquiry from {{submitter_name}}`
- **Attachment**: PDF of full inquiry (`Fiscal-Sponsorship-Inquiry-{name}-{YYYY-MM-DD}.pdf`)
- **Template Variables**: `{{first_name}}`, `{{submitter_name}}`, `{{submitter_email}}`, `{{inquiry_id}}`, `{{submitted_date}}`, `{{artist_project_name}}`
- **Full HTML copy/paste**: see [`docs/postmark-fiscal-sponsorship-inquiry-templates.md`](docs/postmark-fiscal-sponsorship-inquiry-templates.md)

#### Template: `fiscal-sponsorship-inquiry-confirmation`
- **Alias**: `fiscal-sponsorship-inquiry-confirmation`
- **Subject**: `We received your fiscal sponsorship inquiry`
- **Attachment**: Same PDF as admin email
- **Template Variables**: same as admin (except `{{is_admin}}` is only set on admin sends)
- **Full HTML copy/paste**: see [`docs/postmark-fiscal-sponsorship-inquiry-templates.md`](docs/postmark-fiscal-sponsorship-inquiry-templates.md)

#### Template: `documentation-inquiry-admin`
- **Alias**: `documentation-inquiry-admin`
- **Subject**: `New photography & videography inquiry from {{submitter_name}}`
- **Attachment**: PDF of full inquiry (`Documentation-Inquiry-{name}-{YYYY-MM-DD}.pdf`)
- **Template Variables**: `{{first_name}}`, `{{submitter_name}}`, `{{submitter_email}}`, `{{inquiry_id}}`, `{{submitted_date}}`
- **Full HTML copy/paste**: see [`docs/postmark-documentation-inquiry-templates.md`](docs/postmark-documentation-inquiry-templates.md)

#### Template: `documentation-inquiry-confirmation`
- **Alias**: `documentation-inquiry-confirmation`
- **Subject**: (configure in Postmark, e.g. `We received your photography & videography inquiry`)
- **Attachment**: Same PDF as admin email
- **Template Variables**: same as admin (except `{{is_admin}}` is only set on admin sends)
- **Full HTML copy/paste**: see [`docs/postmark-documentation-inquiry-templates.md`](docs/postmark-documentation-inquiry-templates.md)

#### Template: `fiscal-service-inquiry-admin`
- **Alias**: `fiscal-service-inquiry-admin`
- **Subject**: `New fiscal service inquiry from {{submitter_name}}`
- **Attachment**: PDF of full inquiry (`Fiscal-Service-Inquiry-{name}-{YYYY-MM-DD}.pdf`)
- **Template Variables**: `{{first_name}}`, `{{submitter_name}}`, `{{submitter_email}}`, `{{inquiry_id}}`, `{{submitted_date}}`
- **Full HTML copy/paste**: see [`docs/postmark-fiscal-service-inquiry-templates.md`](docs/postmark-fiscal-service-inquiry-templates.md)

#### Template: `fiscal-service-inquiry-confirmation`
- **Alias**: `fiscal-service-inquiry-confirmation`
- **Subject**: (configure in Postmark, e.g. `We received your fiscal services inquiry`)
- **Attachment**: Same PDF as admin email
- **Template Variables**: same as admin (except `{{is_admin}}` is only set on admin sends)
- **Full HTML copy/paste**: see [`docs/postmark-fiscal-service-inquiry-templates.md`](docs/postmark-fiscal-service-inquiry-templates.md)

**Flow:** `POST /api/service-inquiries` with `service_slug: fiscal-sponsorship` → `trySendFiscalSponsorshipInquiryEmails()` (admin + submitter + PDF). With `service_slug: documentation` → `trySendDocumentationInquiryEmails()` (admin + submitter + PDF). With `service_slug: fiscal-services` → `trySendFiscalServicesInquiryEmails()` (admin + submitter + PDF). Other services use the simple HTML `trySendServiceInquiryNotification`.

## Current Implementation

### Listing Confirmation Email

When a user submits a listing, a confirmation email is automatically sent:

**Flow:**
1. User submits listing via `/api/events` POST endpoint
2. Listing is created in database
3. `sendListingConfirmationEmail()` is called from the API route
4. Email is sent using the `listing-received` template

**Location:** `src/app/api/events/route.ts` (lines 110-114)

**Service Function:** `src/features/events/server/service.ts` (lines 114-124)

**Error Handling:**
- Email failures are caught and logged
- Listing creation still succeeds even if email fails
- Errors are logged to console for debugging

### Profile Creation Admin Notification

When a new user signs up, an admin notification email is automatically sent:

**Flow:**
1. User completes signup via `signupAction()` server action
2. Profile is created in database
3. `sendNewProfileAdminEmail()` is called after profile creation
4. Email is sent using the `admin-new-user` template

**Location:** `src/features/profile/server/signup.ts` (after profile creation)

**Service Function:** `src/features/profile/server/service.ts` (`sendNewProfileAdminEmail`)

**Error Handling:**
- Email failures are caught and logged
- Signup still succeeds even if email fails
- Errors are logged to console for debugging

**Environment Variable:**
- `ADMIN_NOTIFICATION_EMAIL` - Email address to receive admin notifications (see also `ADMIN_EMAIL` in donation section below)

### Paid donation — artist and admin internal notification

When a donation is paid via Stripe Checkout, internal templated emails (with PDF attachment) can be sent to the fiscal recipient’s profile email and to the admin address. The donor no longer receives a separate Postmark “donor receipt” template.

**Flow:**
1. Stripe webhook (`checkout.session.completed` or `payment_intent.succeeded`) updates the donation to `paid`
2. `trySendInternalDonationNotifications()` runs (from `src/app/api/stripe/webhook/route.ts`)
3. Postmark sends `donation-notification-artist` and/or `donation-notification-admin` with the same generated PDF

**Idempotency:** `donations.internal_notification_sent_at` is set when the send is claimed; failed sends roll back the timestamp for retry.

**Environment variables:** `ADMIN_EMAIL` or `ADMIN_NOTIFICATION_EMAIL` (optional alias), plus standard Postmark `POSTMARK_*` sender vars.

### Profile Approval User Notification

When an admin approves a user's profile, a notification email is automatically sent to the user:

**Flow:**
1. Admin marks profile as reviewed via `/api/admin/profiles` PATCH endpoint
2. Profile is updated in database (`artist_status_reviewed_at` is set)
3. `sendProfileApprovalEmail()` is called after profile update
4. Email is sent using the `profile-approved` template

**Location:** `src/features/users/server/service.ts` (`markProfileReviewed` function)

**Service Function:** `src/features/profile/server/service.ts` (`sendProfileApprovalEmail`)

**Error Handling:**
- Email failures are caught and logged
- Profile approval still succeeds even if email fails
- Errors are logged to console for debugging

### Email Verification

When a new user signs up, an email verification email is automatically sent:

**Flow:**
1. User completes signup via `signupAction()` server action
2. Profile is created in database
3. `sendEmailVerificationEmail()` is called after profile creation
4. Verification link is generated using Supabase admin API
5. Email is sent using the `email-confirmation` template

**Location:** `src/features/profile/server/signup.ts` (after profile creation)

**Service Function:** `src/features/profile/server/service.ts` (`sendEmailVerificationEmail`)

**Error Handling:**
- Email failures are caught and logged
- Signup still succeeds even if email fails
- Errors are logged to console for debugging

**Verification Link:**
- Generated using `supabase.auth.admin.generateLink()` (magic link) with `redirectTo` set to `{NEXT_PUBLIC_APP_URL}/auth/callback` (see `getPublicAppUrl()` in `src/lib/app-url.ts` when the env var is unset).
- **`/auth/callback`** (client page at `src/app/auth/callback/page.tsx` using `completeAuthCallbackClient` in `src/lib/auth/completeAuthCallbackClient.ts`) exchanges a PKCE `code` or parses hash tokens (`magiclink`, `signup`, etc.), sets the session via the browser Supabase client, then redirects (default `next=/announcement`, with `verified=1` appended).
- **Supabase dashboard:** set **Site URL** and **Redirect URLs** to your production origin and include:
  - `https://<your-domain>/auth/callback` (email verification / magic link)
  - `https://<your-domain>/auth/callback/recovery` (**required** for password reset — Supabase often strips `?next=` from the main callback URL)
  - Local dev: `http://localhost:3000/auth/callback`, `http://localhost:3000/auth/callback/recovery`, etc.
- **Resend:** Users can trigger `resendVerificationEmailAction` from the signup confirm page (`src/features/profile/server/resendVerification.ts`).
- **Expired/invalid links:** Supabase may redirect to **Site URL** with query params such as `error=access_denied&error_code=otp_expired`. The app middleware and home page (`src/app/page.tsx`) forward those visits to `/auth/signin` with a clear message instead of silently sending users to announcements.
- Link expires according to Supabase configuration.

### Password reset email

- **Forgot password:** `src/app/auth/forgot-password/page.tsx` calls `requestPasswordResetAction` (server action).
- `requestPasswordResetAction` (`src/features/profile/server/requestPasswordReset.ts`) uses service role to look up the user, calls `sendPasswordResetEmail`, and always returns a generic success message to avoid email enumeration.
- `sendPasswordResetEmail` (`src/features/profile/server/service.ts`) generates a Supabase `recovery` link with `redirectTo` `{NEXT_PUBLIC_APP_URL}/auth/callback/recovery`, then sends through Postmark template alias `password-reset`.
- **New password:** `src/app/auth/reset-password/page.tsx` uses the recovery session and `updateUser({ password })`.

## Adding New Email Types

### Step 1: Add Email Type to `sendListingEmail.ts`

```typescript
// Add to ListingEmailType union
type ListingEmailType = 
  | "listing-received" 
  | "listing-updated"
  | "listing-approved"  // New type
  | "listing-rejected"  // New type
```

### Step 2: Create Service Function

Add a new function in `src/features/events/server/service.ts`:

```typescript
export async function sendListingApprovalEmail(
  input: CreateListingInput,
  listingId: string
): Promise<void> {
  const listingTitle = getListingTitle(input)
  await sendListingEmail("listing-approved", {
    to: input.base.contact_email,
    submitterName: input.base.contact_name,
    listingTitle,
    listingId,
  })
}
```

### Step 3: Create Postmark Template

1. Go to Postmark dashboard → Templates
2. Create new template with alias matching your email type (e.g., `listing-approved`)
3. Add template variables that match what you're sending
4. Design your email template

### Step 4: Call from Appropriate Location

Call your service function from the relevant API route or server action:

```typescript
// Example: In admin approval route
try {
  await sendListingApprovalEmail(listingInput, listingId)
} catch (emailError) {
  console.error("Failed to send approval email:", emailError)
  // Don't fail the approval if email fails
}
```

## Template Variables

### Standard Variables (for listing emails)

- `submitter_name` - String - Name of the person who submitted
- `listing_title` - String - Title of the listing (auto-extracted)
- `cta_url` - String - Full URL to view listing in dashboard

### Adding Custom Variables

If you need additional variables, update both:

1. **Template Model** in `sendListingEmail.ts`:
```typescript
TemplateModel: {
  submitter_name: submitterName,
  listing_title: listingTitle,
  cta_url: `${baseUrl}/dashboard/listings/${listingId}`,
  custom_field: customValue,  // Add here
}
```

2. **Postmark Template** - Add `{{custom_field}}` in your template

## Error Handling Best Practices

### 1. Don't Fail Critical Operations

Email sending should not block critical operations (like creating a listing):

```typescript
try {
  await sendListingConfirmationEmail(input, listingId)
} catch (emailError) {
  console.error("Failed to send email:", emailError)
  // Continue with success response
}
```

### 2. Log Errors for Debugging

Always log email errors so you can monitor and fix issues:

```typescript
catch (emailError) {
  console.error("Failed to send listing confirmation email:", emailError)
  // In production, consider using a logging service
}
```

### 3. Consider Async/Background Processing

For high-volume scenarios, consider:
- Queueing emails (e.g., using a job queue)
- Sending emails asynchronously (fire-and-forget)
- Batching emails

## Testing

### Development/Staging

1. **Check Environment Variable**: Ensure `POSTMARK_TRANSACTIONAL_TOKEN` is set
2. **Use Postmark Test Server**: Postmark provides test servers for development
3. **Check Postmark Dashboard**: View sent emails in Postmark's Activity feed
4. **Monitor Console**: Check for error logs

### Testing Email Sending

```typescript
// In a test or development script
import { sendListingConfirmationEmail } from "@/features/events/server/service"

const testInput = {
  type: "performance",
  base: {
    contact_name: "Test User",
    contact_email: "test@example.com",
    // ... other fields
  },
  details: {
    title: "Test Performance",
    // ... other fields
  },
  occurrences: [/* ... */],
}

await sendListingConfirmationEmail(testInput, "test-listing-id")
```

## Troubleshooting

### Quick Diagnostic Checklist

Before diving into specific issues, verify these basics:

- [ ] `POSTMARK_TRANSACTIONAL_TOKEN` is set and valid
- [ ] `POSTMARK_FROM_NAME` is set (e.g., "EAR")
- [ ] `POSTMARK_FROM_EMAIL` is set and matches a verified Sender Signature in Postmark
- [ ] Email template exists in Postmark with the correct alias
- [ ] Template is active (not archived) in Postmark
- [ ] Server logs show email attempts (check for `[EMAIL]` prefixed logs)

### Issue: "Missing Postmark sender env variables"

**Error Message:**
```
Missing Postmark sender environment variables: POSTMARK_FROM_NAME, POSTMARK_FROM_EMAIL
```

**Symptoms:**
- Email sending fails immediately
- Error appears in server logs before attempting to send

**Solution:**
1. Check your environment variables:
   ```bash
   echo $POSTMARK_FROM_NAME
   echo $POSTMARK_FROM_EMAIL
   ```

2. Add to `.env.local` (or your deployment environment):
   ```bash
   POSTMARK_FROM_NAME=EAR
   POSTMARK_FROM_EMAIL=no-reply@earplatform.org
   ```

3. Restart your development server or redeploy

4. Verify the variables are loaded (check server startup logs for `[EMAIL] ✅ Postmark client initialized`)

### Issue: "The 'From' address is not a Sender Signature"

**Error Message:**
```
The 'From' address you supplied (EAR <no-reply@earplatform.org>) is not a Sender Signature on your account
```

**Symptoms:**
- Email sending fails with 422 status code
- Error appears after attempting to send

**Solution:**
1. Go to Postmark Dashboard → Sender Signatures
2. Check if your email address is listed and verified
3. If not present:
   - Click "Add Signature" or "Verify a domain"
   - Enter the email address from `POSTMARK_FROM_EMAIL` (e.g., `no-reply@earplatform.org`)
   - Complete domain verification (add DNS records if needed)
   - Wait for verification to complete (usually a few minutes)
4. If present but not verified:
   - Click on the signature
   - Complete the verification process
5. Ensure `POSTMARK_FROM_EMAIL` exactly matches the verified address (case-sensitive)
6. Try sending again

**Common Mistakes:**
- Using a different email than what's verified (e.g., verified `noreply@domain.com` but using `no-reply@domain.com`)
- Domain not fully verified (check DNS records)
- Using a different domain than verified

### Issue: Template Not Found

**Error Message:**
```
Template with alias 'listing-received' not found
```

**Symptoms:**
- Email sending fails
- Error mentions template alias

**Solution:**
1. Go to Postmark Dashboard → Templates
2. Search for template with alias matching your email type (e.g., `listing-received`)
3. If template doesn't exist:
   - Create a new template
   - Set the alias exactly as used in code (case-sensitive)
   - Add required template variables: `{{submitter_name}}`, `{{listing_title}}`, `{{cta_url}}`
4. If template exists but is archived:
   - Unarchive the template
5. Verify template is active and published

### Issue: Template Variables Not Rendering

**Symptoms:**
- Email sends successfully but shows `{{variable_name}}` instead of actual values
- Variables appear blank in emails

**Solution:**
1. **Check Variable Names** (case-sensitive):
   - Code uses: `submitter_name`, `listing_title`, `cta_url`
   - Template must use: `{{submitter_name}}`, `{{listing_title}}`, `{{cta_url}}`
   - No spaces, exact spelling

2. **Check Template Syntax**:
   - Use double curly braces: `{{variable_name}}`
   - Not single braces: `{variable_name}` ❌
   - Not without braces: `variable_name` ❌

3. **Verify Data is Being Passed**:
   - Check server logs for `[EMAIL] 📤 Sending email via Postmark`
   - Look at `templateModel` in the logs to see what data is being sent
   - Ensure values are not null or undefined

4. **Test in Postmark**:
   - Use Postmark's template testing feature
   - Send a test email with sample data

### Issue: Email Not Appearing in Inbox

**Symptoms:**
- No error in logs
- Email shows as sent in Postmark dashboard
- Recipient doesn't receive email

**Solution:**
1. **Check Postmark Activity Feed**:
   - Go to Postmark Dashboard → Activity
   - Find your email
   - Check delivery status (Delivered, Bounced, Spam, etc.)

2. **Check Spam Folder**:
   - Ask recipient to check spam/junk folder
   - Check if email is being filtered

3. **Verify Recipient Email**:
   - Check server logs for the `to` address
   - Ensure email address is valid and correct

4. **Check Bounce Status**:
   - If bounced, check bounce reason in Postmark
   - Common reasons: invalid email, mailbox full, domain issues

5. **Check Rate Limits**:
   - Postmark has rate limits based on your plan
   - Check if you've exceeded limits in Postmark dashboard

### Issue: Rate Limiting

**Symptoms:**
- Emails fail after sending many in a short time
- Error mentions rate limit or quota

**Solution:**
1. Check your Postmark plan limits
2. Monitor usage in Postmark Dashboard → Activity
3. Implement rate limiting in your code:
   - Add delays between sends
   - Queue emails for later sending
   - Batch emails when possible
4. Consider upgrading your Postmark plan
5. For high volume, consider:
   - Using a job queue (Bull, BullMQ)
   - Implementing exponential backoff retry logic

### Issue: Postmark Client Not Initialized

**Error Message:**
```
Postmark client not initialized. POSTMARK_TRANSACTIONAL_TOKEN is missing.
```

**Symptoms:**
- Email sending fails immediately
- Warning in server startup logs

**Solution:**
1. Check `POSTMARK_TRANSACTIONAL_TOKEN` is set:
   ```bash
   echo $POSTMARK_TRANSACTIONAL_TOKEN
   ```

2. Verify token is correct:
   - Go to Postmark Dashboard → Servers
   - Copy the Server API Token
   - Ensure it matches your environment variable

3. Check token hasn't expired or been regenerated

4. Restart server after setting environment variable

### Debugging Tips

1. **Check Server Logs**:
   - Look for `[EMAIL]` prefixed logs
   - Success: `[EMAIL] ✅ Email sent successfully`
   - Errors: `[EMAIL] ❌` with detailed error information

2. **Use Postmark Dashboard**:
   - Activity feed shows all email attempts
   - Templates section shows all available templates
   - Sender Signatures shows verified addresses

3. **Test Environment Variables**:
   ```bash
   # In your terminal
   node -e "console.log('FROM_NAME:', process.env.POSTMARK_FROM_NAME)"
   node -e "console.log('FROM_EMAIL:', process.env.POSTMARK_FROM_EMAIL)"
   ```

4. **Verify Email Pattern**:
   - Expected format: `{POSTMARK_FROM_NAME} <{POSTMARK_FROM_EMAIL}>`
   - Example: `EAR <no-reply@earplatform.org>`
   - Check logs for `from: emailData.From` to see what's being sent

### Getting Help

If you've tried the above and still have issues:

1. **Check Logs**: Share the full error log with `[EMAIL]` prefix
2. **Postmark Support**: Check Postmark's status page and documentation
3. **Verify Setup**: Double-check all environment variables and Postmark configuration
4. **Test Template**: Use Postmark's template tester with sample data

## Future Enhancements

### Potential Improvements

1. **Email Queue System**
   - Use a job queue (e.g., Bull, BullMQ) for reliable delivery
   - Retry failed emails automatically
   - Batch email sending

2. **Email Preferences**
   - Allow users to opt-out of certain email types
   - Store preferences in database

3. **Email Templates in Code**
   - Store templates in codebase for version control
   - Use template engine (e.g., Handlebars) for dynamic content

4. **Analytics**
   - Track email open rates
   - Track click-through rates
   - Monitor bounce rates

5. **Multi-language Support**
   - Support multiple email templates per language
   - Detect user language preference

## Related Files

- `src/lib/email/postmark.ts` - Postmark client
- `src/lib/email/sendListingEmail.ts` - Listing email functions
- `src/lib/email/sendListingShareEmail.ts` - Share-listing Postmark templates (`listing-share-festival`, `listing-share-piece`)
- `src/lib/listing-share.ts` - Normalize / cap share recipient emails
- `src/features/events/server/listing-meta-share.ts` - Merge `listings.meta` safely (client cannot set `share.sent_at`)
- `src/lib/email/sendProfileEmail.ts` - Profile email functions
- `src/lib/email/sendInternalDonationEmail.ts` - Donation internal template + PDF
- `src/lib/email/trySendInternalDonationNotifications.ts` - Webhook orchestration
- `src/lib/stripe/donationHelpers.ts` - Shared amount/date helpers for donations
- `src/app/api/stripe/webhook/route.ts` - Stripe webhook (donation notifications)
- `src/features/events/server/service.ts` - Listing email service functions
- `src/features/profile/server/service.ts` - Profile email service functions
- `src/features/events/server/listing-utils.ts` - Listing title extraction
- `src/app/api/events/route.ts` - API route that sends listing emails
- `src/features/profile/server/signup.ts` - Signup action that sends admin notification
- `src/features/users/server/service.ts` - Profile approval that sends user notification

## Resources

- [Postmark Documentation](https://postmarkapp.com/developer)
- [Postmark Template API](https://postmarkapp.com/developer/api/templates-api)
- [Postmark Transactional API](https://postmarkapp.com/developer/api/transactional-api)
