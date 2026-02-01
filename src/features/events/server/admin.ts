import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { storageService } from "@/services/storage"
import type { ListingStatus, ListingType } from "./repository-types"

export async function approveListingRepo(listingId: string, reviewerId: string) {
  const supabase = await getSupabaseServerClient()
  const svc = getSupabaseServiceClient()
  
  // 1) Update listing status
  const { error } = await supabase
    .from("listings")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    })
    .eq("id", listingId)
  if (error) throw new Error(`Failed to approve listing: ${error.message}`)

  // 2) Move photos from private to public bucket
  const { data: photos, error: photosError } = await supabase
    .from("listing_photos")
    .select("id, path")
    .eq("listing_id", listingId)

  if (photosError) {
    console.error(`Failed to fetch photos for listing ${listingId}:`, photosError)
    // Don't fail approval if photos can't be moved
  } else if (photos && photos.length > 0) {
    // Move each photo from private to public bucket
    const privateBucket = "event-photos"
    const publicBucket = "event-photos-public"
    
    for (const photo of photos) {
      try {
        await storageService.moveFile(svc, privateBucket, publicBucket, photo.path)
      } catch (moveError) {
        console.error(`Failed to move photo ${photo.id} (${photo.path}):`, moveError)
        // Continue with other photos even if one fails
      }
    }
  }
}

export async function rejectListingRepo(
  listingId: string,
  reviewerId: string,
  admin_notes?: string
) {
  const supabase = await getSupabaseServerClient()
  
  const updateData: {
    status: string
    reviewed_at: string
    reviewed_by: string
    notes?: string
  } = {
    status: "rejected",
    reviewed_at: new Date().toISOString(),
    reviewed_by: reviewerId,
  }
  
  if (admin_notes) {
    const { data: existing } = await supabase
      .from("listings")
      .select("notes")
      .eq("id", listingId)
      .single()
    updateData.notes = existing?.notes 
      ? `${existing.notes}\n\nAdmin notes: ${admin_notes}`
      : `Admin notes: ${admin_notes}`
  }
  
  const { error } = await supabase
    .from("listings")
    .update(updateData)
    .eq("id", listingId)
  if (error) throw error
}

export async function deleteListingRepo(listingId: string, deletedBy: string) {
  const svc = getSupabaseServiceClient()
  
  const { error } = await svc
    .from("listings")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
  
  if (error) throw new Error(`Failed to delete listing: ${error.message}`)
}

export async function listAdminListingsRepo(params: {
  status: ListingStatus
  limit: number
}) {
  const svc = getSupabaseServiceClient()
  const { data, error } = await svc
    .from("listings")
    .select(`
      id, type, status, submitted_at,
      performance_details (title),
      audition_details (title),
      creative_details (title),
      class_workshop_details (title)
    `)
    .eq("status", params.status)
    .is("deleted_at", null)
    .order("submitted_at", { ascending: false })
    .limit(params.limit)
  if (error) throw error

  return (data ?? []).map((e: any) => {
    const title =
      e.type === "performance" ? e.performance_details?.title :
      e.type === "audition" ? e.audition_details?.title :
      e.type === "creative" ? e.creative_details?.title :
      e.type === "class" ? e.class_workshop_details?.title :
      "Untitled"
    return {
      id: e.id,
      type: e.type,
      status: e.status,
      submitted_at: e.submitted_at,
      title: title ?? null,
    }
  })
}

export async function getAdminListingDetailRepo(listingId: string) {
  const svc = getSupabaseServiceClient()
  const { data, error } = await svc
    .from("listings")
    .select(`
      id, type, status, submitted_at,
      contact_name, pronouns, contact_email, company, company_website,
      address, place_id, lat, lng, venue_name, location_instructions,
      social_handles, notes, meta,
      performance_details (*),
      audition_details (*),
      creative_details (*),
      class_workshop_details (*),
      piece_details!piece_details_listing_id_fkey (*),
      listing_occurrences (*),
      listing_photos (*)
    `)
    .eq("id", listingId)
    .is("deleted_at", null)
    .single()
  if (error) throw error

  // Generate URLs for photos
  // Approved listings use public bucket, pending/rejected use private bucket with signed URLs
  if (data.listing_photos && Array.isArray(data.listing_photos) && data.listing_photos.length > 0) {
    const isApproved = data.status === "approved"
    const bucket = isApproved ? "event-photos-public" : "event-photos"
    
    const photosWithUrls = await Promise.all(
      data.listing_photos.map(async (photo: { path: string; id: string; credit?: string | null; sort_order?: number }) => {
        if (isApproved) {
          // Use public URL for approved listings
          return {
            ...photo,
            url: storageService.getPublicUrl(svc, bucket, photo.path),
          }
        } else {
          // Use signed URL for pending/rejected listings
          const { data: signed } = await svc.storage
            .from(bucket)
            .createSignedUrl(photo.path, 3600) // 1 hour expiry
          
          return {
            ...photo,
            url: signed?.signedUrl ?? null,
          }
        }
      })
    )
    data.listing_photos = photosWithUrls
  }

  return data
}
