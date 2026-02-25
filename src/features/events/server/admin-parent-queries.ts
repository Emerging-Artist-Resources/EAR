import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { normalizeSupabaseRelation } from "./admin-utils"

export async function listPiecesNeedingLinkRepo() {
  const svc = getSupabaseServiceClient()
  
  const { data, error } = await svc
    .from("listings")
    .select(`
      id,
      status,
      submitted_at,
      contact_name,
      contact_email,
      address,
      venue_name,
      location_instructions,
      notes,
      performance_details!inner (subtype),
      piece_details!piece_details_listing_id_fkey (
        parent_event_name,
        parent_event_website,
        parent_event_contact_email,
        parent_listing_id,
        piece_title,
        piece_company,
        piece_company_website,
        piece_description,
        choreographer
      ),
      listing_occurrences!listing_occurrences_listing_id_fkey (
        id,
        starts_at_utc,
        ends_at_utc,
        tz,
        venue_name,
        address
      )
    `)
    .eq("performance_details.subtype", "PIECE")
    .is("piece_details.parent_listing_id", null)
    .not("piece_details.parent_event_name", "is", null)
    .is("deleted_at", null)
    .order("submitted_at", { ascending: false })
  
  if (error) throw error
  
  return (data ?? [])
    .filter((item: any) => {
      const pieceDetails = normalizeSupabaseRelation(item.piece_details)
      return pieceDetails && pieceDetails.parent_event_name && !pieceDetails.parent_listing_id
    })
    .map((item: any) => {
      const pieceDetails = normalizeSupabaseRelation(item.piece_details)
      const occurrences = Array.isArray(item.listing_occurrences) 
        ? item.listing_occurrences 
        : (item.listing_occurrences ? [item.listing_occurrences] : [])
      
      return {
        id: item.id,
        status: item.status,
        submitted_at: item.submitted_at,
        piece_title: pieceDetails?.piece_title || null,
        piece_company: pieceDetails?.piece_company || null,
        piece_company_website: pieceDetails?.piece_company_website || null,
        piece_description: pieceDetails?.piece_description || null,
        choreographer: pieceDetails?.choreographer || null,
        contact_name: item.contact_name || null,
        contact_email: item.contact_email || null,
        notes: item.notes || null,
        address: item.address || null,
        venue_name: item.venue_name || null,
        location_instructions: item.location_instructions || null,
        occurrences: occurrences
          .map((occ: any) => ({
            id: occ.id,
            starts_at_utc: occ.starts_at_utc,
            ends_at_utc: occ.ends_at_utc || null,
            tz: occ.tz,
            venue_name: occ.venue_name || null,
            address: occ.address || null,
          }))
          .sort((a: any, b: any) => new Date(a.starts_at_utc).getTime() - new Date(b.starts_at_utc).getTime()),
        parent_event_name: pieceDetails?.parent_event_name || null,
        parent_event_website: pieceDetails?.parent_event_website || null,
        parent_event_contact_email: pieceDetails?.parent_event_contact_email || null,
      }
    })
}

export async function listClassesNeedingLinkRepo() {
  const svc = getSupabaseServiceClient()
  
  const { data, error } = await svc
    .from("listings")
    .select(`
      id,
      status,
      submitted_at,
      contact_name,
      contact_email,
      address,
      venue_name,
      location_instructions,
      class_workshop_details!class_workshop_details_listing_id_fkey!inner (
        class_workshop_type,
        title,
        organizer,
        teachers,
        parent_workshop_name,
        parent_workshop_website,
        parent_workshop_contact_email,
        parent_listing_id
      ),
      listing_occurrences!listing_occurrences_listing_id_fkey (
        id,
        starts_at_utc,
        ends_at_utc,
        tz,
        venue_name,
        address
      )
    `)
    .eq("class_workshop_details.class_workshop_type", "CLASS")
    .is("class_workshop_details.parent_listing_id", null)
    .not("class_workshop_details.parent_workshop_name", "is", null)
    .is("deleted_at", null)
    .order("submitted_at", { ascending: false })
  
  if (error) throw error
  
  return (data ?? [])
    .filter((item: any) => {
      const classDetails = normalizeSupabaseRelation(item.class_workshop_details)
      return classDetails && classDetails.parent_workshop_name && !classDetails.parent_listing_id
    })
    .map((item: any) => {
      const classDetails = normalizeSupabaseRelation(item.class_workshop_details)
      const occurrences = Array.isArray(item.listing_occurrences) 
        ? item.listing_occurrences 
        : (item.listing_occurrences ? [item.listing_occurrences] : [])
      
      return {
        id: item.id,
        status: item.status,
        submitted_at: item.submitted_at,
        title: classDetails?.title || null,
        organizer: classDetails?.organizer || null,
        teachers: classDetails?.teachers || null,
        contact_name: item.contact_name || null,
        contact_email: item.contact_email || null,
        address: item.address || null,
        venue_name: item.venue_name || null,
        location_instructions: item.location_instructions || null,
        occurrences: occurrences.map((occ: any) => ({
          id: occ.id,
          starts_at_utc: occ.starts_at_utc,
          ends_at_utc: occ.ends_at_utc || null,
          tz: occ.tz,
          venue_name: occ.venue_name || null,
          address: occ.address || null,
        })),
        parent_workshop_name: classDetails?.parent_workshop_name || null,
        parent_workshop_website: classDetails?.parent_workshop_website || null,
        parent_workshop_contact_email: classDetails?.parent_workshop_contact_email || null,
      }
    })
}
