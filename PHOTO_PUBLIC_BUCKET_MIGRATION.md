# Photo Migration to Public Bucket on Approval

## Overview

Photos are now automatically moved from a private bucket to a public bucket when a listing is approved. This enables:
- Direct public access for website display
- Social media sharing
- No signed URL overhead for approved listings
- Better performance and caching

## Implementation

### Storage Buckets

1. **Private Bucket**: `event-photos`
   - Used for pending/rejected listings
   - Requires signed URLs for access
   - Secure until approval

2. **Public Bucket**: `event-photos-public`
   - Used for approved listings
   - Publicly accessible via direct URLs
   - No authentication required

### Flow

#### 1. Photo Upload (Initial)
- Photos uploaded to private bucket: `event-photos`
- Path stored in `listing_photos` table
- Listing status: `pending`

#### 2. Approval Process
When admin approves listing:
1. Listing status updated to `approved`
2. All photos for the listing are moved from `event-photos` → `event-photos-public`
3. Photos use same path in both buckets
4. Original files deleted from private bucket after successful copy

#### 3. Public Access
- Approved listings: Use public URLs from `event-photos-public` bucket
- Pending/Rejected listings: Use signed URLs from `event-photos` bucket

## Code Changes

### Storage Service (`src/services/storage.ts`)
- Added `copyFile()` - Copies file between buckets
- Added `moveFile()` - Moves file between buckets (copy + delete)

### Repository (`src/features/events/server/repository.ts`)
- **`approveListingRepo()`**: 
  - Moves photos to public bucket on approval
  - Handles errors gracefully (approval succeeds even if photo move fails)
  
- **`getListingPublicRepo()`**: 
  - Generates public URLs for approved listings
  - Uses `event-photos-public` bucket
  
- **`getAdminListingDetailRepo()`**: 
  - Uses public URLs for approved listings
  - Uses signed URLs for pending/rejected listings

### API Endpoints

- **`/api/admin/photos/[listingId]`**: 
  - Returns public URLs for approved listings
  - Returns signed URLs for pending/rejected listings

- **`/api/calendar/occurrence/[id]`**: 
  - Uses public URLs for approved listings (no signed URLs needed)

## Setup Requirements

### Supabase Storage Buckets

You need to create two buckets in Supabase:

1. **`event-photos`** (Private)
   - Public: `false`
   - File size limit: As needed
   - Allowed MIME types: `image/*`

2. **`event-photos-public`** (Public)
   - Public: `true` ⚠️ **IMPORTANT: Must be public**
   - File size limit: As needed
   - Allowed MIME types: `image/*`

### Storage Policies

**Private Bucket (`event-photos`)**:
- Upload: Authenticated users only
- Download: Authenticated users + service role

**Public Bucket (`event-photos-public`)**:
- Upload: Service role only (via approval process)
- Download: Public (anyone can read)

## Error Handling

- Photo migration failures are logged but don't block approval
- If photo move fails, listing is still approved
- Admin can manually retry photo migration if needed
- Photos remain accessible via signed URLs if move fails

## Benefits

1. **Performance**: Public URLs are faster (no signed URL generation)
2. **Caching**: Public URLs can be cached by CDN/browser
3. **Social Media**: Direct URLs work for Open Graph, Twitter Cards, etc.
4. **SEO**: Search engines can index images
5. **Simplicity**: No signed URL expiry management for public content

## Migration Notes

### Existing Approved Listings

If you have existing approved listings with photos in the private bucket:
1. Run a migration script to move photos to public bucket
2. Or photos will be moved automatically on next approval (if listing is re-approved)

### Rollback

If a listing is rejected after approval:
- Photos remain in public bucket (not moved back)
- This is acceptable as rejected listings are not displayed publicly
- Can add logic to move back if needed

## Testing Checklist

- [ ] Photos upload to private bucket correctly
- [ ] Photos move to public bucket on approval
- [ ] Public URLs work for approved listings
- [ ] Signed URLs still work for pending listings
- [ ] Admin can view photos for both approved and pending listings
- [ ] Public calendar displays photos correctly
- [ ] Social media sharing works with public URLs
- [ ] Error handling works if photo move fails
