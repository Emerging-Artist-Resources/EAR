import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClientAnon } from "@/lib/supabase/serverAnon"
import { getListingTitle } from "@/features/events/server/listing-utils"
import { normalizeSupabaseRelation, isLinkedPiece, isLinkedClass } from "@/features/events/server/admin-utils"
import type { PublicListingDetail } from "@/components/calendar/PublicListingDetailSections"
import { getCoverPhotoPublic } from "@/lib/listing-photo-cover"

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    
    const supabase = getSupabaseServerClientAnon()
    
    const { data: relationships, error: relationshipsError } = await supabase
      .from("listing_relationships")
      .select(`
        child_listing_id,
        relationship_type,
        listings!listing_relationships_child_listing_id_fkey (
          id,
          type,
          status,
          submitted_at,
          notes,
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
        )
      `)
      .eq("parent_listing_id", id)
    
    if (relationshipsError) {
      console.error("Error fetching child listings:", relationshipsError)
      return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
    }
    
    console.log(`[Children Route] Found ${relationships?.length || 0} relationships for parent ${id}`)
    
    if (!relationships || relationships.length === 0) {
      console.log(`[Children Route] No relationships found for parent ${id}`)
      return NextResponse.json({ data: [] }, { 
        headers: { "Cache-Control": "s-maxage=60" } 
      })
    }
    
    const childListings = relationships
      .map((rel: any) => {
        const listing = rel.listings
        
        if (!listing) {
          console.log(`[Children Route] Missing listing for relationship - child_listing_id: ${rel.child_listing_id}, relationship_type: ${rel.relationship_type}`)
          return null
        }
        
        if (listing.status !== "approved") {
          console.log(`[Children Route] Listing ${listing.id} filtered out - status: ${listing.status} (not approved)`)
          return null
        }
        
        if (listing.deleted_at) {
          console.log(`[Children Route] Listing ${listing.id} filtered out - deleted_at: ${listing.deleted_at}`)
          return null
        }
        
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
        
        const pieceLinked = isLinkedPiece(listing)
        const classLinked = isLinkedClass(listing)
        
        const pieceDetails = normalizeSupabaseRelation(listing.piece_details)
        const classDetails = normalizeSupabaseRelation(listing.class_workshop_details)
        
        if (pieceLinked) {
          console.log(`[Children Route] Processing piece ${listing.id} - title: ${title}, parent_listing_id: ${pieceDetails?.parent_listing_id}`)
        }
        
        if (classLinked) {
          console.log(`[Children Route] Processing class ${listing.id} - title: ${title}, parent_listing_id: ${classDetails?.parent_listing_id}`)
        }
        
        const allOccurrences = listing.listing_occurrences
          ?.filter((occ: any) => occ.starts_at_utc)
          .sort((a: any, b: any) => 
            new Date(a.starts_at_utc).getTime() - new Date(b.starts_at_utc).getTime()
          ) || []

        const cover = getCoverPhotoPublic(listing.listing_photos)
        
        return {
          id: listing.id,
          type: listing.type,
          title,
          relationship_type: rel.relationship_type,
          is_piece: pieceLinked,
          is_class: classLinked,
          parent_listing_id: pieceLinked ? pieceDetails?.parent_listing_id : 
                            classLinked ? classDetails?.parent_listing_id : 
                            undefined,
          starts_at_utc: earliestOccurrence?.starts_at_utc || null,
          ends_at_utc: earliestOccurrence?.ends_at_utc || null,
          tz: earliestOccurrence?.tz || null,
          piece_company: pieceLinked ? pieceDetails?.piece_company || null : null,
          piece_company_website: pieceLinked ? pieceDetails?.piece_company_website || null : null,
          piece_description: pieceLinked ? pieceDetails?.piece_description || null : null,
          choreographer: pieceLinked ? pieceDetails?.choreographer || null : null,
          class_title: classLinked ? classDetails?.title || null : null,
          class_description: classLinked ? classDetails?.description || null : null,
          class_organizer: classLinked ? classDetails?.organizer || null : null,
          class_teachers: classLinked ? classDetails?.teachers || null : null,
          class_price: classLinked ? classDetails?.price || null : null,
          class_link: classLinked ? classDetails?.link || null : null,
          class_style_category: classLinked ? classDetails?.style_category || null : null,
          notes: listing.notes || null,
          cover_image_url: cover?.url ?? null,
          cover_image_credit: cover?.credit ?? null,
          occurrences: allOccurrences.map((occ: any) => ({
            id: occ.id,
            starts_at_utc: occ.starts_at_utc,
            ends_at_utc: occ.ends_at_utc || null,
            tz: occ.tz,
          })),
        }
      })
      .filter((listing: any) => listing !== null)
      .sort((a: any, b: any) => {
        if (a.starts_at_utc && b.starts_at_utc) {
          return new Date(a.starts_at_utc).getTime() - new Date(b.starts_at_utc).getTime()
        }
        if (a.starts_at_utc) return -1
        if (b.starts_at_utc) return 1
        return 0
      })
    
    const pieceCount = childListings.filter((l: any) => l.is_piece).length
    const classCount = childListings.filter((l: any) => l.is_class).length
    console.log(`[Children Route] Returning ${childListings.length} child listings (${pieceCount} pieces, ${classCount} classes) for parent ${id}`)
    
    return NextResponse.json({ data: childListings }, { 
      headers: { "Cache-Control": "s-maxage=60" } 
    })
  } catch (err) {
    console.error("Child listings GET error:", err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}
