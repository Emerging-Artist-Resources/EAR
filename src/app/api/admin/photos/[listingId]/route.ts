import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { getUserRole } from "@/lib/authz"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { storageService } from "@/services/storage"

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await ctx.params
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = getUserRole(user)
    
    if (!user?.id || (role !== 'ADMIN' && role !== 'REVIEWER')) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
    }

    // Get listing status to determine which bucket to use
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("status")
      .eq("id", listingId)
      .single()

    if (listingError) throw listingError

    // Get photos for this listing
    const { data: photos, error } = await supabase
      .from("listing_photos")
      .select("id, path, credit, sort_order")
      .eq("listing_id", listingId)
      .order("sort_order", { ascending: true })

    if (error) throw error

    // Generate URLs for each photo
    // Approved listings use public bucket, pending/rejected use private bucket with signed URLs
    const svc = getSupabaseServiceClient()
    const isApproved = listing.status === "approved"
    const bucket = isApproved ? "event-photos-public" : "event-photos"
    
    const photosWithUrls = await Promise.all(
      (photos || []).map(async (photo) => {
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

    return NextResponse.json({ data: photosWithUrls })
  } catch (err) {
    console.error('Admin photos GET error:', err)
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}
