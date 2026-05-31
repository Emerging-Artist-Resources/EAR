import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClientAnon } from "@/lib/supabase/serverAnon"
import { getListingTitle } from "@/features/events/server/listing-utils"
import { normalizeSupabaseRelation, isLinkedPiece, isLinkedClass } from "@/features/events/server/admin-utils"
import type { PublicListingDetail } from "@/components/calendar/PublicListingDetailSections"
import { getListingCardSummary } from "@/lib/listings/card-display"

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
          company,
          address,
          place_id,
          venue_name,
          meta,
          performance_details (*),
          audition_details (*),
          creative_details (*),
          class_workshop_details!class_workshop_details_listing_id_fkey (*),
          piece_details!piece_details_listing_id_fkey (*),
          listing_occurrences!listing_occurrences_listing_id_fkey (
            id,
            starts_at_utc,
            ends_at_utc,
            tz,
            occurrence_type,
            address,
            place_id,
            venue_name
          )
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
          company: listing.company ?? null,
          address: listing.address ?? null,
          place_id: listing.place_id ?? null,
          venue_name: listing.venue_name ?? null,
          meta: listing.meta ?? null,
          performance_details: listing.performance_details,
          audition_details: listing.audition_details,
          creative_details: listing.creative_details,
          class_workshop_details: listing.class_workshop_details,
          piece_details: listing.piece_details,
          listing_occurrences: listing.listing_occurrences || [],
        }

        const title = getListingTitle(listingDetail)
        const summary = getListingCardSummary(listingDetail)
        const pieceLinked = isLinkedPiece(listing)
        const classLinked = isLinkedClass(listing)
        const pieceDetails = normalizeSupabaseRelation(listing.piece_details)
        const classDetails = normalizeSupabaseRelation(listing.class_workshop_details)
        const earliestEvent = summary.events[0]

        if (pieceLinked) {
          console.log(`[Children Route] Processing piece ${listing.id} - title: ${title}, parent_listing_id: ${pieceDetails?.parent_listing_id}`)
        }

        if (classLinked) {
          console.log(`[Children Route] Processing class ${listing.id} - title: ${title}, parent_listing_id: ${classDetails?.parent_listing_id}`)
        }

        const occurrences = [...summary.deadlines, ...summary.events].map((occ) => ({
          id: occ.id,
          starts_at_utc: occ.starts_at_utc,
          ends_at_utc: occ.ends_at_utc,
          tz: occ.tz ?? "UTC",
          occurrence_type: occ.occurrence_type ?? "event",
        }))

        return {
          id: listing.id,
          type: listing.type,
          title,
          relationship_type: rel.relationship_type,
          is_piece: pieceLinked,
          is_class: classLinked,
          parent_listing_id: pieceLinked
            ? pieceDetails?.parent_listing_id
            : classLinked
              ? classDetails?.parent_listing_id
              : undefined,
          submitted_at: listing.submitted_at,
          host: summary.host,
          description: summary.description,
          venue: summary.venue,
          price: summary.price,
          link: summary.link,
          starts_at_utc: earliestEvent?.starts_at_utc ?? null,
          ends_at_utc: earliestEvent?.ends_at_utc ?? null,
          piece_company: pieceLinked ? pieceDetails?.piece_company || null : null,
          piece_description: pieceLinked ? pieceDetails?.piece_description || null : null,
          choreographer: pieceLinked ? pieceDetails?.choreographer || null : null,
          class_description: classLinked ? classDetails?.description || null : null,
          class_organizer: classLinked ? classDetails?.organizer || null : null,
          class_teachers: classLinked ? classDetails?.teachers || null : null,
          occurrences,
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
