# Listing Form Submission Testing Checklist

## Frontend-Backend Connection Status ✅

### Verified Connections:
1. **EventWizard Form** → `buildEventPayload()` → `apiPost("/api/events")` ✅
2. **API Route** (`/api/events`) → Validates with Zod schema → `createEventOwnedRepo()` ✅
3. **Repository** → Inserts into `listings`, detail tables, `listing_occurrences`, `listing_photos` ✅

### Fixed Issues:
- ✅ Added `pronouns` field to API route `baseSchema` to match payload builder

## Testing Checklist

### 1. Performance (ORGANIZER) Submission
- [ ] Fill out basic info (contact name, email, company, etc.)
- [ ] Add performance details (title, description, organizer, etc.)
- [ ] Add at least one date/time occurrence
- [ ] Optionally add location per occurrence
- [ ] Submit form
- [ ] Verify:
  - [ ] Listing appears in admin dashboard with status "pending"
  - [ ] All base fields saved correctly (company, company_website, etc.)
  - [ ] Performance details saved correctly
  - [ ] Occurrences saved with `occurrence_type: 'event'`
  - [ ] Location fields saved per occurrence if provided

### 2. Performance (PIECE) Submission
- [ ] Select "PIECE" subtype
- [ ] Try with parent listing ID (if parent exists)
- [ ] Try without parent listing ID (provide manual parent info)
- [ ] Add piece details (parent event name, contact email, etc.)
- [ ] Add date/time occurrences
- [ ] Submit form
- [ ] Verify:
  - [ ] `piece_details` table populated correctly
  - [ ] `listing_relationships` created if parent_listing_id provided
  - [ ] Manual parent info saved if no parent_listing_id

### 3. Audition Submission
- [ ] Fill out audition details
- [ ] Add event occurrences (audition dates/times)
- [ ] Add deadline occurrences (deadline dates/times)
- [ ] Submit form
- [ ] Verify:
  - [ ] Event occurrences saved with `occurrence_type: 'event'`
  - [ ] Deadline occurrences saved with `occurrence_type: 'deadline'`
  - [ ] Fee option mapped correctly (FEE → PAY_FEE, NO_FEE → null)

### 4. Creative Opportunity Submission
- [ ] Fill out creative opportunity details
- [ ] Add deadline occurrences (if applicable)
- [ ] Submit form
- [ ] Verify:
  - [ ] Deadline occurrences saved with `occurrence_type: 'deadline'`
  - [ ] All detail fields saved correctly

### 5. Class/Workshop Submission
- [ ] Fill out class/workshop details
- [ ] Add date/time occurrences
- [ ] Optionally add location per occurrence
- [ ] Submit form
- [ ] Verify:
  - [ ] Class details saved correctly
  - [ ] Occurrences saved with `occurrence_type: 'event'`
  - [ ] Location fields saved per occurrence if provided

### 6. Admin Dashboard Verification
- [ ] View submitted listings in admin dashboard
- [ ] Verify all fields display correctly
- [ ] Check photo handling:
  - [ ] Pending listings: photos should be in private bucket (signed URLs)
  - [ ] Approved listings: photos should be in public bucket (public URLs)
- [ ] Test photo download functionality

### 7. Photo Upload/Download
- [ ] Upload photos during form submission
- [ ] Verify photos saved to `listing_photos` table
- [ ] Check admin dashboard can view/download photos
- [ ] Approve a listing
- [ ] Verify photos moved from private to public bucket
- [ ] Verify public URLs work for approved listings

## Common Issues to Watch For

### Date/Time Conversion
- ⚠️ **Potential Issue**: Date/time conversion uses `:00Z` which assumes UTC
- The `tz` field is stored, but actual UTC conversion might need adjustment
- **Test**: Submit a form with a specific time and verify it appears correctly in calendar

### Field Name Mismatches
- ✅ Fixed: `org_name` → `company`, `org_website` → `company_website`
- ✅ Fixed: `social_handles` type (JSONB → TEXT)

### Enum Mismatches
- ✅ Fixed: Fee enums unified to `PROVIDE` for both performance and class
- ✅ Fixed: `FEE`/`NO_FEE` mapped to `PAY_FEE`/`null` in payload builders

### Missing Fields
- ✅ Fixed: Added `pronouns` to API schema
- ✅ Fixed: Added location fields to occurrences
- ✅ Fixed: Added `occurrence_type` to occurrences

## Database Verification Queries

After submitting test forms, run these queries to verify data:

```sql
-- Check recent listings
SELECT id, type, status, contact_name, company, created_at 
FROM listings 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check occurrences
SELECT lo.listing_id, lo.occurrence_type, lo.starts_at_utc, lo.address, lo.venue_name
FROM listing_occurrences lo
JOIN listings l ON l.id = lo.listing_id
WHERE l.created_at > NOW() - INTERVAL '1 hour';

-- Check piece details
SELECT pd.*, l.type, l.status
FROM piece_details pd
JOIN listings l ON l.id = pd.listing_id
WHERE l.created_at > NOW() - INTERVAL '1 hour';

-- Check photos
SELECT lp.listing_id, lp.path, lp.sort_order, l.status
FROM listing_photos lp
JOIN listings l ON l.id = lp.listing_id
WHERE l.created_at > NOW() - INTERVAL '1 hour'
ORDER BY lp.listing_id, lp.sort_order;
```

## Next Steps After Testing

1. If date/time conversion issues found → Update payload builders to use proper timezone conversion
2. If any field mismatches → Update schema or payload builders accordingly
3. If photo handling issues → Verify storage service functions
4. If admin dashboard issues → Check admin components for field name updates
