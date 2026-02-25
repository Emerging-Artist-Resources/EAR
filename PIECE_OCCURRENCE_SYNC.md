# Piece Occurrence Synchronization

## Overview

When a participant submits a piece with an event association and uses custom dates (CUSTOM schedule mode), those custom dates are now automatically added to the parent event's schedule once the piece is approved. If the piece is later rejected, those occurrences are removed from the parent event.

## Implementation Details

### Schema Changes

A new migration file `sql_files/add_piece_occurrence_tracking.sql` adds:
- `source_piece_listing_id` column to `listing_occurrences` table
- Index for efficient lookups when removing occurrences on piece rejection
- This field tracks which piece added each occurrence to the parent event

### Approval Flow

When a piece is approved (`approveListingRepo`):
1. Checks if the listing is a piece with `piece_schedule_mode = 'CUSTOM'`
2. Verifies the parent is a performance ORGANIZER
3. Fetches the piece's custom occurrences
4. Checks for duplicates against parent's existing occurrences (by date/time and all location fields)
5. Adds non-duplicate occurrences to the parent event with `source_piece_listing_id` set

### Rejection Flow

When a piece is rejected (`rejectListingRepo`):
1. Finds all occurrences on parent events where `source_piece_listing_id` matches the rejected piece
2. Removes those occurrences from the parent event

### Safeguards

1. **Only for CUSTOM mode**: Only pieces with `piece_schedule_mode = 'CUSTOM'` have their occurrences added
2. **Duplicate checking**: Occurrences are only added if they don't already exist on the parent (matching by date/time and all location fields)
3. **Source tracking**: Each occurrence added by a piece is tagged with `source_piece_listing_id` for safe removal on rejection
4. **Error handling**: Failures in adding/removing occurrences don't block approval/rejection
5. **Parent validation**: Only adds to parent events that are performance ORGANIZER types

### UI Updates

The message in `PieceOccurrencesPicker.tsx` has been updated to clarify that custom dates/times are added "once your piece is approved" rather than immediately on submission.

## Migration Required

Before deploying, run the SQL migration:
```sql
-- Run: sql_files/add_piece_occurrence_tracking.sql
```

This adds the `source_piece_listing_id` column to `listing_occurrences` table.
