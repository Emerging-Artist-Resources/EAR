# Schema Review: Listings Schema vs Forms Alignment

## Critical Issues Found

### 1. Fee Enum Mismatch ⚠️ CRITICAL

**Schema**: Uses unified `PROVIDE` enum
```sql
CREATE TYPE listing_fee_option AS ENUM (
  'PAY_FEE',
  'PROVIDE',  -- Unified for both ticket and guest spot
  'EXPLAIN'
);
```

**Forms**: Still use separate values
- Performance: `["PAY_FEE", "PROVIDE_TICKET", "EXPLAIN"]` ❌
- Class/Workshop: `["PAY_FEE", "PROVIDE_GUEST_SPOT", "EXPLAIN"]` ❌

**Fix Required**: Update validation schemas to use `PROVIDE` instead of `PROVIDE_TICKET` and `PROVIDE_GUEST_SPOT`

---

### 2. Field Name Mismatches in Payload Builders ⚠️ CRITICAL

**Schema Fields**:
- `company` (TEXT) - not `org_name`
- `company_website` (TEXT) - not `org_website`
- `social_handles` (TEXT) - not JSONB object

**Payload Builder Issues**:
```typescript
// Current (WRONG):
base: {
  org_name: data.company || null,  // ❌ Should be 'company'
  org_website: data.companyWebsite || null,  // ❌ Should be 'company_website'
  social_handles: { raw: data.socialHandles || "" },  // ❌ Should be TEXT string
}
```

**Fix Required**: Update `buildBasePayload` to use correct field names matching schema

---

### 3. Location Per Occurrence Not Handled ⚠️ CRITICAL

**Schema**: `listing_occurrences` table has location fields:
- `address`, `place_id`, `lat`, `lng`, `venue_name`, `location_instructions`

**Forms**: Support location per occurrence via `locationConfig` in `DateTimeList` component

**Payload Builders**: ❌ **NOT extracting location from occurrences**
```typescript
// Current (MISSING location):
occurrences.push({
  starts_at_utc: new Date(`${d.date}T${t.time}:00Z`).toISOString(),
  tz,
  // ❌ Missing: address, place_id, lat, lng, venue_name, location_instructions
})
```

**Fix Required**: 
- Update `occurrenceSchema` in forms to include location fields
- Update payload builders to extract location from each occurrence
- Pass location fields when creating `listing_occurrences`

---

### 4. Deadline Occurrences Not Handled ⚠️ CRITICAL

**Schema**: Uses `occurrence_type` enum:
- `'event'` for regular occurrences
- `'deadline'` for audition/creative deadlines

**Forms**: Have `deadlineOccurrences` array for auditions and creative opportunities

**Payload Builders**: ❌ **NOT creating deadline occurrences**
- `buildAuditionPayload`: Creates event occurrences but not deadline occurrences
- `buildCreativePayload`: Doesn't create any occurrences (deadlines should be created)

**Fix Required**:
- Update payload builders to create deadline occurrences with `occurrence_type = 'deadline'`
- Update repository to accept `occurrence_type` in occurrences array

---

### 5. Performance Details Field Mismatches ⚠️ CRITICAL

**Schema Fields**:
- `title` (TEXT)
- `description` (TEXT)
- `organizer` (TEXT)
- `website` (TEXT)
- `link` (TEXT)
- `price` (TEXT)
- `participants` (TEXT)
- `subtype` (performance_subtype) - REQUIRED
- `event_type` (performance_event_type)
- `listing_fee_option` (listing_fee_option)
- `listing_fee_explanation` (TEXT)
- `complementary_ticket_info` (TEXT)
- `guest_spot_info` (TEXT)

**Payload Builder Issues**:
```typescript
// Current (WRONG field names):
details: {
  show_name: data.title ?? "",  // ❌ Should be 'title'
  short_description: data.description ?? "",  // ❌ Should be 'description'
  credit_info: data.credits ?? "",  // ❌ Not in performance_details (should be in listings.notes or meta)
  ticket_price_cents: Number(...),  // ❌ Should be 'price' (TEXT, not cents)
  ticket_link: data.link ?? "",  // ❌ Should be 'link'
  agree_comp_tickets: Boolean(...),  // ✅ Correct
  // ❌ Missing: organizer, website, participants, subtype, event_type, listing_fee_option, etc.
}
```

**Fix Required**: Completely rewrite performance details mapping

---

### 6. Audition Details Field Mismatches ⚠️ CRITICAL

**Schema Fields**:
- `title` (TEXT NOT NULL)
- `description` (TEXT NOT NULL)
- `eligibility` (TEXT NOT NULL)
- `compensation` (TEXT NOT NULL)
- `instructions` (TEXT NOT NULL)
- `pre_audition_classes` (TEXT)
- `fee` (listing_fee_option) - NULL for NO_FEE
- `fee_amount` (TEXT)
- `artist_type` (artist_type)

**Payload Builder Issues**:
```typescript
// Current (WRONG field names):
details: {
  audition_name: data.title ?? "",  // ❌ Should be 'title'
  about_project: data.description ?? "",  // ❌ Should be 'description'
  eligibility: data.eligibility ?? "",  // ✅ Correct
  compensation: data.compensation ?? "",  // ✅ Correct
  audition_link: data.instructions ?? "",  // ❌ Should be 'instructions'
  // ❌ Missing: pre_audition_classes, fee, fee_amount, artist_type
}
```

**Fix Required**: Update audition details mapping

---

### 7. Creative Details Field Mismatches ⚠️ CRITICAL

**Schema Fields**:
- `title` (TEXT NOT NULL)
- `description` (TEXT NOT NULL)
- `host` (TEXT NOT NULL)
- `dates` (TEXT NOT NULL)
- `compensation` (TEXT NOT NULL)
- `requirements` (TEXT NOT NULL)
- `link` (TEXT NOT NULL)
- `fee` (listing_fee_option)
- `fee_amount` (TEXT)
- `artist_type` (artist_type)

**Payload Builder Issues**:
```typescript
// Current (WRONG field names):
details: {
  opportunity_name: data.title ?? "",  // ❌ Should be 'title'
  brief_description: data.description ?? "",  // ❌ Should be 'description'
  eligibility: data.requirements ?? "",  // ❌ Wrong field
  whats_offered: data.compensation ?? "",  // ❌ Should be 'compensation'
  stipend_amount: "",  // ❌ Not in schema
  requirements: data.requirements ?? "",  // ✅ Correct
  deadline: deadlineIso,  // ❌ Should be in listing_occurrences with type='deadline'
  apply_link: data.link ?? "",  // ❌ Should be 'link'
  // ❌ Missing: host, dates, fee, fee_amount, artist_type
}
```

**Fix Required**: Update creative details mapping

---

### 8. Class/Workshop Details Field Mismatches ⚠️ CRITICAL

**Schema Fields**:
- `class_workshop_type` (class_workshop_type NOT NULL)
- `title` (TEXT NOT NULL)
- `description` (TEXT NOT NULL)
- `organizer` (TEXT NOT NULL)
- `teachers` (TEXT NOT NULL)
- `price` (TEXT)
- `link` (TEXT)
- `style_category` (TEXT)
- `workshop_details` (TEXT)
- `classes_offered` (TEXT)
- `drop_in_classes` (TEXT)
- `artist_type` (artist_type)
- `listing_fee_option` (listing_fee_option)
- `listing_fee_explanation` (TEXT)
- `guest_spot_info` (TEXT)

**Payload Builder Issues**:
```typescript
// Current (WRONG field names):
details: {
  festival_name: data.festivalName || null,  // ❌ Legacy field, not in schema
  festival_link: data.festivalLink || null,  // ❌ Legacy field, not in schema
  class_name: data.title ?? data.className ?? "",  // ❌ Should be 'title'
  description: data.description ?? data.classDescription ?? "",  // ✅ Correct
  prices: pricesArray,  // ❌ Should be 'price' (single TEXT field)
  rrule: data.classRecurrence || null,  // ❌ Not in schema
  // ❌ Missing: class_workshop_type, organizer, teachers, link, style_category, etc.
}
```

**Fix Required**: Completely rewrite class/workshop details mapping

---

### 9. Piece Details Not Created ⚠️ CRITICAL

**Schema**: `piece_details` table must be created for PIECE subtype performances

**Forms**: Support piece submission with:
- `parentEventMode`: "SELECT" or "MANUAL"
- `parentEventId`: UUID if SELECT mode
- `parentEventName`, `parentEventWebsite`, `parentEventTicketLink`, `parentEventContactEmail`: if MANUAL mode
- `pieceScheduleMode`: "FROM_PARENT" or "CUSTOM"
- `selectedSlots`: array if FROM_PARENT mode

**Payload Builders**: ❌ **NOT creating piece_details**

**Fix Required**:
- Detect when `type === "PIECE"` in performance payload
- Create `piece_details` record with appropriate fields
- Create `listing_relationships` record if `parentEventId` exists

---

### 10. Occurrence Type Not Passed ⚠️ CRITICAL

**Schema**: `listing_occurrences` requires `occurrence_type` (defaults to 'event')

**Payload Builders**: ❌ **NOT passing occurrence_type**

**Repository**: ❌ **NOT accepting occurrence_type in occurrences array**

**Fix Required**:
- Update `EventPayload` type to include `occurrence_type` in occurrences
- Update payload builders to set `occurrence_type: 'deadline'` for deadline occurrences
- Update repository to accept and store `occurrence_type`

---

## Summary of Required Fixes

### High Priority (Blocks Functionality)
1. ✅ Update fee enum in validation schemas (`PROVIDE_TICKET`/`PROVIDE_GUEST_SPOT` → `PROVIDE`)
2. ✅ Fix base payload field names (`org_name` → `company`, `org_website` → `company_website`, `social_handles` → TEXT)
3. ✅ Add location per occurrence extraction in payload builders
4. ✅ Add deadline occurrences handling with `occurrence_type = 'deadline'`
5. ✅ Fix all detail table field name mappings
6. ✅ Add `piece_details` creation for PIECE submissions
7. ✅ Add `occurrence_type` to occurrences array

### Medium Priority (Data Quality)
8. Add validation for required fields matching schema constraints
9. Ensure `subtype` is set for performance listings
10. Ensure `class_workshop_type` is set for class listings

### Low Priority (Nice to Have)
11. Add proper error messages for schema constraint violations
12. Add migration guide for existing data

---

## Recommended Implementation Order

1. **Fix validation schemas** (fee enum) - prevents invalid data entry
2. **Fix payload builders** (field names, location, deadlines) - ensures correct data structure
3. **Update repository** (accept occurrence_type, piece_details) - ensures data is stored correctly
4. **Test end-to-end** - verify forms → payload → database flow

---

## Notes

- The current codebase appears to still be using an `events` table structure, not the new `listings` schema
- A migration will be needed to move from `events` → `listings` schema
- All field name changes need to be coordinated between frontend forms, payload builders, and database schema

---

## ✅ FIXES COMPLETED

### 1. Fee Enum Updated ✅
- Changed `PROVIDE_TICKET` and `PROVIDE_GUEST_SPOT` to `PROVIDE` in validation schemas
- Updated both performance and class/workshop fee options

### 2. Payload Builder Field Names Fixed ✅
- Updated `buildBasePayload` to use correct field names:
  - `org_name` → `company`
  - `org_website` → `company_website`
  - `social_handles` → TEXT string (not JSONB object)
  - Added: `place_id`, `lat`, `lng`, `venue_name`, `location_instructions`

### 3. Location Per Occurrence Added ✅
- Updated all payload builders to extract location fields from occurrence date items
- Location fields now included in occurrences array:
  - `address`, `place_id`, `lat`, `lng`, `venue_name`, `location_instructions`

### 4. Deadline Occurrences Implemented ✅
- `buildAuditionPayload`: Creates deadline occurrences with `occurrence_type = 'deadline'`
- `buildCreativePayload`: Creates deadline occurrences with `occurrence_type = 'deadline'`
- All occurrences now include `occurrence_type` field

### 5. Detail Table Field Mappings Fixed ✅
- **Performance**: All fields mapped correctly (`title`, `description`, `organizer`, etc.)
- **Audition**: All fields mapped correctly (`title`, `description`, `eligibility`, etc.)
- **Creative**: All fields mapped correctly (`title`, `description`, `host`, `dates`, etc.)
- **Class/Workshop**: All fields mapped correctly including `class_workshop_type`

### 6. Piece Details Creation Added ✅
- `buildPerformancePayload` now creates `piece_details` object when `type === "PIECE"`
- Includes all parent event information (manual or selected)
- Includes schedule mode and selected slots

### 7. Occurrence Type Added ✅
- All occurrences now include `occurrence_type` field
- Defaults to `'event'` for regular occurrences
- Set to `'deadline'` for deadline occurrences

---

## ⚠️ REMAINING WORK

The repository layer (`createEventOwnedRepo`, `createEventWithDetails`) still needs to be updated to:
1. Use `listings` table instead of `events` table
2. Accept new field names (`company`, `company_website`, etc.)
3. Handle `occurrence_type` in occurrences
4. Handle location fields in occurrences
5. Create `piece_details` records for PIECE submissions
6. Create `listing_relationships` for parent-child connections

The payload builders are now correctly structured and ready for the repository migration.
