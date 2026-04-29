import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClientAnon } from "@/lib/supabase/serverAnon"
import { getListingTitle } from "@/features/events/server/listing-utils"
import { normalizeSupabaseRelation, isLinkedPiece, isLinkedClass } from "@/features/events/server/admin-utils"
import type { PublicListingDetail } from "@/components/calendar/PublicListingDetailSections"
import { getCoverPhotoPublic } from "@/lib/listing-photo-cover"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 12), 20)
    
    const supabase = getSupabaseServerClientAnon()
    
    // Fetch recent listings including pieces and classes
    const { data: listings, error } = await supabase
      .from("listings")
      .select(`
        id,
        type,
        status,
        submitted_at,
        performance_details (*),
        audition_details (*),
        creative_details (*),
        class_workshop_details!class_workshop_details_listing_id_fkey (*),
        piece_details!piece_details_listing_id_fkey (*),
        listing_occurrences!listing_occurrences_listing_id_fkey (
          id,
          starts_at_utc,
          ends_at_utc,
          tz
        ),
        listing_photos ( id, path, credit, sort_order )
      `)
      .eq("status", "approved")
      .is("deleted_at", null)
      .order("submitted_at", { ascending: false })
      .limit(limit * 3)
    
    if (error) {
      console.error("Error fetching recent listings:", error)
      return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
    }
    
    if (!listings || listings.length === 0) {
      return NextResponse.json({ data: [] }, { 
        headers: { "Cache-Control": "s-maxage=60" } 
      })
    }
    
    // Track parent IDs and their most recent child submission dates
    const parentSubmissionMap = new Map<string, { submitted_at: string }>()
    const parentIds: string[] = []
    const standaloneListings: any[] = []
    
    listings.forEach((listing: any) => {
      const pieceLinked = isLinkedPiece(listing)
      const classLinked = isLinkedClass(listing)
      
      if (pieceLinked) {
        const pieceDetails = normalizeSupabaseRelation(listing.piece_details)
        const parentId = pieceDetails?.parent_listing_id
        if (parentId) {
          const existing = parentSubmissionMap.get(parentId)
          if (!existing || new Date(listing.submitted_at) > new Date(existing.submitted_at)) {
            parentSubmissionMap.set(parentId, { submitted_at: listing.submitted_at })
          }
          if (!parentIds.includes(parentId)) {
            parentIds.push(parentId)
          }
        } else {
          standaloneListings.push(listing)
        }
      } else if (classLinked) {
        const classDetails = normalizeSupabaseRelation(listing.class_workshop_details)
        const parentId = classDetails?.parent_listing_id
        if (parentId) {
          const existing = parentSubmissionMap.get(parentId)
          if (!existing || new Date(listing.submitted_at) > new Date(existing.submitted_at)) {
            parentSubmissionMap.set(parentId, { submitted_at: listing.submitted_at })
          }
          if (!parentIds.includes(parentId)) {
            parentIds.push(parentId)
          }
        } else {
          standaloneListings.push(listing)
        }
      } else {
        standaloneListings.push(listing)
      }
    })
    
    // Fetch parent listings
    const parentListings: any[] = []
    if (parentIds.length > 0) {
      const { data: parents, error: parentsError } = await supabase
        .from("listings")
        .select(`
          id,
          type,
          status,
          performance_details (*),
          class_workshop_details!class_workshop_details_listing_id_fkey (*),
          listing_occurrences!listing_occurrences_listing_id_fkey (
            id,
            starts_at_utc,
            ends_at_utc,
            tz
          ),
          listing_photos ( id, path, credit, sort_order )
        `)
        .in("id", parentIds)
        .eq("status", "approved")
        .is("deleted_at", null)
      
      if (!parentsError && parents) {
        parents.forEach((parent: any) => {
          const perfDetails = normalizeSupabaseRelation(parent.performance_details)
          const classDetails = normalizeSupabaseRelation(parent.class_workshop_details)
          
          // Only include if it's a performance ORGANIZER or workshop
          if ((parent.type === "performance" && perfDetails?.subtype === "ORGANIZER") ||
              (parent.type === "class" && classDetails?.class_workshop_type === "WORKSHOP")) {
            parentListings.push({
              ...parent,
              submitted_at: parentSubmissionMap.get(parent.id)?.submitted_at || parent.submitted_at,
            })
          }
        })
      }
    }
    
    // Process standalone listings
    const processedStandalone = standaloneListings.map((listing: any) => {
      const listingDetail: PublicListingDetail = {
        id: listing.id,
        type: listing.type,
        performance_details: listing.performance_details,
        audition_details: listing.audition_details,
        creative_details: listing.creative_details,
        class_workshop_details: listing.class_workshop_details,
        piece_details: listing.piece_details,
        listing_occurrences: listing.listing_occurrences || [],
      }
      
      const title = getListingTitle(listingDetail)
      
      const earliestOccurrence = listing.listing_occurrences
        ?.filter((occ: any) => occ.starts_at_utc)
        .sort((a: any, b: any) => 
          new Date(a.starts_at_utc).getTime() - new Date(b.starts_at_utc).getTime()
        )[0]
      
      const cover = getCoverPhotoPublic(listing.listing_photos)

      return {
        id: listing.id,
        type: listing.type,
        title,
        submitted_at: listing.submitted_at,
        starts_at_utc: earliestOccurrence?.starts_at_utc || null,
        ends_at_utc: earliestOccurrence?.ends_at_utc || null,
        tz: earliestOccurrence?.tz || null,
        cover_image_url: cover?.url ?? null,
        cover_image_credit: cover?.credit ?? null,
      }
    })
    
    // Process parent listings
    const processedParents = parentListings.map((parent: any) => {
      const listingDetail: PublicListingDetail = {
        id: parent.id,
        type: parent.type,
        performance_details: parent.performance_details,
        class_workshop_details: parent.class_workshop_details,
        listing_occurrences: parent.listing_occurrences || [],
      }
      
      const title = getListingTitle(listingDetail)
      
      const earliestOccurrence = parent.listing_occurrences
        ?.filter((occ: any) => occ.starts_at_utc)
        .sort((a: any, b: any) => 
          new Date(a.starts_at_utc).getTime() - new Date(b.starts_at_utc).getTime()
        )[0]
      
      const cover = getCoverPhotoPublic(parent.listing_photos)

      return {
        id: parent.id,
        type: parent.type,
        title,
        submitted_at: parent.submitted_at,
        starts_at_utc: earliestOccurrence?.starts_at_utc || null,
        ends_at_utc: earliestOccurrence?.ends_at_utc || null,
        tz: earliestOccurrence?.tz || null,
        cover_image_url: cover?.url ?? null,
        cover_image_credit: cover?.credit ?? null,
      }
    })
    
    // Combine and deduplicate by id, keeping the one with most recent submitted_at
    const allListings = [...processedStandalone, ...processedParents]
    const uniqueListings = new Map<string, typeof allListings[0]>()
    
    allListings.forEach((listing) => {
      const existing = uniqueListings.get(listing.id)
      if (!existing || new Date(listing.submitted_at) > new Date(existing.submitted_at)) {
        uniqueListings.set(listing.id, listing)
      }
    })
    
    // Sort by submitted_at descending and limit
    const recentListings = Array.from(uniqueListings.values())
      .sort((a: { submitted_at: string }, b: { submitted_at: string }) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
      .slice(0, limit)
    
    return NextResponse.json({ data: recentListings }, { 
      headers: { "Cache-Control": "s-maxage=300" } 
    })
  } catch (err) {
    console.error("Recent listings GET error:", err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}
