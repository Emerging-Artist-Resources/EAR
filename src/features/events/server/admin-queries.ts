import { getSupabaseServiceClient } from "@/lib/supabase/service"
import type { ListingStatus } from "./repository-types"
import {
  normalizeSupabaseRelation,
  computeListingTitle,
  enrichWithParentTitle,
  generatePhotoUrls,
  fetchParentTitles,
} from "./admin-utils"

export async function listAdminListingsRepo(params: {
  status: ListingStatus
  limit: number
}) {
  const svc = getSupabaseServiceClient()
  
  // When querying for "pending", also include "pending_payment" listings
  const statusFilter = params.status === "pending" 
    ? ["pending", "pending_payment"]
    : [params.status]
  
  const { data, error } = await svc
    .from("listings")
    .select(`
      id, type, status, submitted_at,
      performance_details (title, subtype),
      audition_details (title),
      creative_details (title),
      class_workshop_details!class_workshop_details_listing_id_fkey (title, class_workshop_type, parent_workshop_name, parent_listing_id),
      piece_details!piece_details_listing_id_fkey (parent_event_name, parent_listing_id, piece_title, piece_company, piece_company_website)
    `)
    .in("status", statusFilter)
    .is("deleted_at", null)
    .order("submitted_at", { ascending: false })
    .limit(params.limit)
  if (error) throw error

  const pieceParentIds = (data ?? [])
    .filter((e: any) => {
      if (e.type !== "performance" || normalizeSupabaseRelation(e.performance_details)?.subtype !== "PIECE") return false
      const pieceDetails = normalizeSupabaseRelation(e.piece_details)
      return pieceDetails?.parent_listing_id
    })
    .map((e: any) => {
      const pieceDetails = normalizeSupabaseRelation(e.piece_details)
      return pieceDetails?.parent_listing_id
    })
    .filter((id): id is string => !!id)
  
  const classParentIds = (data ?? [])
    .filter((e: any) => {
      if (e.type !== "class") return false
      const classDetails = normalizeSupabaseRelation(e.class_workshop_details)
      return classDetails?.parent_listing_id && classDetails?.class_workshop_type === "CLASS"
    })
    .map((e: any) => {
      const classDetails = normalizeSupabaseRelation(e.class_workshop_details)
      return classDetails?.parent_listing_id
    })
    .filter((id): id is string => !!id)
  
  const allParentIds = [...new Set([...pieceParentIds, ...classParentIds])]
  const parentTitles = await fetchParentTitles(allParentIds, svc)

  return (data ?? []).map((e: any) => {
    const title = computeListingTitle(e, parentTitles)
    
    return {
      id: e.id,
      type: e.type,
      status: e.status,
      submitted_at: e.submitted_at,
      title: title,
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
      class_workshop_details!class_workshop_details_listing_id_fkey (*),
      piece_details!piece_details_listing_id_fkey (*),
      listing_occurrences!listing_occurrences_listing_id_fkey (*),
      listing_photos (*)
    `)
    .eq("id", listingId)
    .is("deleted_at", null)
    .single()
  if (error) throw error

  await enrichWithParentTitle(data, svc)

  if (data.listing_photos && Array.isArray(data.listing_photos) && data.listing_photos.length > 0) {
    data.listing_photos = await generatePhotoUrls(data.listing_photos, data.status, svc)
  }

  return data
}
