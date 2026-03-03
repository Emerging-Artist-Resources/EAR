// src/app/api/calendar/listing/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getListingPublicRepo, getListingForOwnerRepo } from "@/features/events/server/read"
import { getSupabaseServerClientAnon } from "@/lib/supabase/serverAnon"
import { getAuthenticatedUser } from "@/lib/auth-helpers"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { storageService } from "@/services/storage"

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    
    // Check if user is authenticated and owns the listing
    const auth = await getAuthenticatedUser()
    let isOwner = false
    
    if (auth) {
      const supabase = await getSupabaseServerClient()
      const { data: listing } = await supabase
        .from("listings")
        .select("created_by, status")
        .eq("id", id)
        .single()
      
      isOwner = listing?.created_by === auth.user.id
    }
    
    // If owner, use getListingForOwnerRepo (allows any status including pending)
    // Otherwise, use getListingPublicRepo (only approved)
    const listingData = isOwner 
      ? await getListingForOwnerRepo(id)
      : await getListingPublicRepo(id)
    
    // Handle photos based on listing status
    // Approved listings use public bucket, pending/rejected use private bucket with signed URLs
    if (listingData.listing_photos && Array.isArray(listingData.listing_photos) && listingData.listing_photos.length > 0) {
      const isApproved = listingData.status === "approved"
      const bucket = isApproved ? "event-photos-public" : "event-photos"
      const svc = getSupabaseServiceClient()
      
      listingData.listing_photos = await Promise.all(
        listingData.listing_photos.map(async (photo: { path: string; id: string; credit?: string | null; sort_order?: number }) => {
          if (isApproved) {
            return {
              ...photo,
              url: storageService.getPublicUrl(svc, bucket, photo.path),
            }
          } else {
            // Generate signed URL for pending/rejected listings
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
    }
    
    // Fetch contact info separately since neither function includes them
    const supabase = isOwner 
      ? await getSupabaseServerClient()
      : getSupabaseServerClientAnon()
    
    const contactQuery = supabase
      .from("listings")
      .select(`
        contact_name, 
        pronouns, 
        contact_email
      `)
      .eq("id", id)
      .is("deleted_at", null)
    
    // Only filter by status for non-owners
    if (!isOwner) {
      contactQuery.eq("status", "approved")
    }
    
    const { data: additionalData, error: additionalError } = await contactQuery.single()
    
    if (additionalError && !isOwner) {
      console.error("Error fetching additional data:", additionalError)
    }
    
    const result = {
      ...listingData,
      contact_name: additionalData?.contact_name ?? null,
      pronouns: additionalData?.pronouns ?? null,
      contact_email: additionalData?.contact_email ?? null,
    }
    
    return NextResponse.json({ data: result }, { 
      headers: { "Cache-Control": "s-maxage=60" } 
    })
  } catch (err) {
    console.error("Listing public GET error:", err instanceof Error ? err.message : String(err))
    if (err instanceof Error && err.message.includes("not found")) {
      return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
    }
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}
