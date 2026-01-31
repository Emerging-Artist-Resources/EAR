# Photo Upload/Download Fixes for Admin Dashboard

## ✅ Changes Implemented

### 1. Admin Photo Access API Endpoint
**File**: `src/app/api/admin/photos/[listingId]/route.ts`

- New API endpoint for admin to access listing photos
- Generates signed URLs (1 hour expiry) for photos in private `event-photos` bucket
- Requires ADMIN or REVIEWER role
- Returns photos with URLs for viewing/downloading

### 2. Repository Photo URL Generation
**File**: `src/features/events/server/repository.ts`

- Updated `getAdminListingDetailRepo()` to automatically generate signed URLs for photos
- Photos now include `url` field with signed URL for direct access
- URLs expire after 1 hour for security

### 3. Admin Dashboard Photo Display
**File**: `src/components/admin/events/AdminEventCard.tsx`

**Changes**:
- ✅ Photos now display as thumbnails in a grid layout (2-3 columns)
- ✅ Hover effect shows download button
- ✅ Click to download photos with proper filename
- ✅ Shows photo credit if available
- ✅ Fallback to path display if URL unavailable
- ✅ Supports both `listing_photos` (new) and `event_photos` (legacy) field names

**Visual Improvements**:
- Grid layout: 2 columns on mobile, 3 on desktop
- Thumbnail size: 128px height, object-cover for aspect ratio
- Hover overlay with download button
- Proper image alt text

### 4. Type Updates
**File**: `src/components/admin/events/types.ts`

**Updates**:
- Added `listing_photos` field with `url` property
- Added `listing_occurrences` field
- Updated `social_handles` to support both string (TEXT) and object (legacy JSONB)
- Added `company` and `company_website` fields (replacing `org_name`/`org_website`)
- Maintained backward compatibility with legacy field names

### 5. Field Name Fixes
**File**: `src/components/admin/events/AdminEventCard.tsx`

- Updated to use `company` and `company_website` (new schema)
- Maintains fallback to `org_name` and `org_website` (legacy)
- Updated `social_handles` to handle TEXT format (parses JSON if needed)
- Updated occurrences to use `listing_occurrences` with fallback to `event_occurrences`

## How It Works

### Photo Upload Flow
1. User uploads photos via `PhotoUploader` component
2. Photos are compressed and stored in Supabase Storage bucket `event-photos`
3. Photo paths are stored in `listing_photos` table
4. Paths are included in listing creation payload

### Photo Access Flow (Admin)
1. Admin views listing in admin dashboard
2. `getAdminListingDetailRepo()` fetches listing with photos
3. Repository generates signed URLs for each photo (1 hour expiry)
4. Admin dashboard displays thumbnails with download capability
5. Admin can hover and click "Download" to save photos

### Security
- ✅ Photos stored in private bucket (`event-photos`)
- ✅ Signed URLs expire after 1 hour
- ✅ Only ADMIN and REVIEWER roles can access photos
- ✅ Service client used for signed URL generation (bypasses RLS)

## Usage

### For Admins
1. Navigate to admin dashboard
2. View listing details
3. Photos section shows thumbnails
4. Hover over photo to see download button
5. Click download to save photo

### API Endpoint
```typescript
GET /api/admin/photos/[listingId]
// Returns: { data: Array<{ id, path, credit, sort_order, url }> }
```

## Testing Checklist

- [ ] Admin can view photo thumbnails in dashboard
- [ ] Photos display correctly in grid layout
- [ ] Download button appears on hover
- [ ] Download functionality works (saves file)
- [ ] Photo credits display correctly
- [ ] Fallback to path display works if URL unavailable
- [ ] Signed URLs expire after 1 hour
- [ ] Non-admin users cannot access photo endpoint
- [ ] Works with both `listing_photos` and `event_photos` field names

## Notes

- Photos are stored in private bucket for security
- Signed URLs provide temporary access without making bucket public
- 1 hour expiry balances security and usability
- Grid layout is responsive (2 cols mobile, 3 cols desktop)
- Download filenames: `{listingId}-photo-{photoId}.jpg`
