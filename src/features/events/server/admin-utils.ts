import type { SupabaseClient } from "@supabase/supabase-js"
import { storageService } from "@/services/storage"

/**
 * Normalizes Supabase relation data that can be either a single object or an array
 */
export function normalizeSupabaseRelation<T>(data: T | T[] | null | undefined): T | null {
  if (!data) return null
  if (Array.isArray(data)) {
    return data[0] || null
  }
  return data
}

/**
 * Checks if a listing is a piece linked to a parent performance
 */
export function isLinkedPiece(listing: any): boolean {
  if (listing.type !== "performance") return false
  
  const perfDetails = normalizeSupabaseRelation(listing.performance_details)
  if (perfDetails?.subtype !== "PIECE") return false
  
  const pieceDetails = normalizeSupabaseRelation(listing.piece_details)
  return pieceDetails?.parent_listing_id !== null && pieceDetails?.parent_listing_id !== undefined
}

/**
 * Checks if a listing is a class linked to a parent workshop
 */
export function isLinkedClass(listing: any): boolean {
  if (listing.type !== "class") return false
  
  const classDetails = normalizeSupabaseRelation(listing.class_workshop_details)
  return classDetails?.class_workshop_type === "CLASS" && 
         classDetails?.parent_listing_id !== null && 
         classDetails?.parent_listing_id !== undefined
}

/**
 * Checks if two occurrences are duplicates based on time and location fields
 */
export function isOccurrenceDuplicate(
  occ1: {
    starts_at_utc: string
    address?: string | null
    place_id?: string | null
    venue_name?: string | null
    location_instructions?: string | null
  },
  occ2: {
    starts_at_utc: string
    address?: string | null
    place_id?: string | null
    venue_name?: string | null
    location_instructions?: string | null
  }
): boolean {
  const timeMatch = occ1.starts_at_utc === occ2.starts_at_utc
  const addressMatch = (occ1.address || null) === (occ2.address || null)
  const placeIdMatch = (occ1.place_id || null) === (occ2.place_id || null)
  const venueMatch = (occ1.venue_name || null) === (occ2.venue_name || null)
  const instructionsMatch = (occ1.location_instructions || null) === (occ2.location_instructions || null)

  return timeMatch && addressMatch && placeIdMatch && venueMatch && instructionsMatch
}

/**
 * Collects parent listing IDs from piece and child class listings for batch title lookup.
 */
export function collectParentListingIds(listings: any[]): string[] {
  const pieceParentIds = listings
    .filter((listing) => {
      if (listing.type !== "performance") return false
      const perfDetails = normalizeSupabaseRelation(listing.performance_details)
      if (perfDetails?.subtype !== "PIECE") return false
      const pieceDetails = normalizeSupabaseRelation(listing.piece_details)
      return !!pieceDetails?.parent_listing_id
    })
    .map((listing) => normalizeSupabaseRelation(listing.piece_details)?.parent_listing_id)

  const classParentIds = listings
    .filter((listing) => {
      if (listing.type !== "class") return false
      const classDetails = normalizeSupabaseRelation(listing.class_workshop_details)
      return classDetails?.class_workshop_type === "CLASS" && !!classDetails?.parent_listing_id
    })
    .map((listing) => normalizeSupabaseRelation(listing.class_workshop_details)?.parent_listing_id)

  return [...new Set([...pieceParentIds, ...classParentIds].filter((id): id is string => !!id))]
}

/**
 * Computes display title for a listing, handling pieces and classes with parent listings
 */
export function computeListingTitle(
  listing: any,
  parentTitles?: Record<string, string>
): string | null {
  if (listing.type === "performance") {
    const perfDetails = normalizeSupabaseRelation(listing.performance_details)
    if (perfDetails?.subtype === "PIECE") {
      const pieceDetails = normalizeSupabaseRelation(listing.piece_details)
      const parentEventName = pieceDetails?.parent_event_name
      const parentListingTitle = pieceDetails?.parent_listing_id 
        ? parentTitles?.[pieceDetails.parent_listing_id] 
        : null
      const festivalName = parentListingTitle || parentEventName
      
      const pieceTitle = pieceDetails?.piece_title || pieceDetails?.piece_company || null
      
      if (festivalName && pieceTitle) {
        return `${festivalName} - ${pieceTitle}`
      } else if (festivalName) {
        return festivalName
      } else if (pieceTitle) {
        return pieceTitle
      } else {
        return "Untitled Piece"
      }
    } else {
      return perfDetails?.title ?? null
    }
  } else if (listing.type === "audition") {
    const auditionDetails = normalizeSupabaseRelation(listing.audition_details)
    return auditionDetails?.title ?? null
  } else if (listing.type === "creative") {
    const creativeDetails = normalizeSupabaseRelation(listing.creative_details)
    return creativeDetails?.title ?? null
  } else if (listing.type === "class") {
    const classDetails = normalizeSupabaseRelation(listing.class_workshop_details)
    if (classDetails?.class_workshop_type === "CLASS") {
      const parentWorkshopName = classDetails?.parent_workshop_name
      const parentListingTitle = classDetails?.parent_listing_id 
        ? parentTitles?.[classDetails.parent_listing_id] 
        : null
      const workshopName = parentListingTitle || parentWorkshopName
      
      const className = classDetails?.title || null
      
      if (workshopName && className) {
        return `${workshopName} - ${className}`
      } else if (workshopName) {
        return workshopName
      } else if (className) {
        return className
      } else {
        return "Untitled Class"
      }
    } else {
      return classDetails?.title ?? null
    }
  } else {
    return "Untitled"
  }
}

/**
 * Enriches listing data with parent title for pieces and classes
 */
export async function enrichWithParentTitle(
  listing: any,
  supabase: SupabaseClient
): Promise<void> {
  const perfDetails = normalizeSupabaseRelation(listing.performance_details)
  const pieceDetails = normalizeSupabaseRelation(listing.piece_details)
  
  if (listing.type === "performance" && perfDetails?.subtype === "PIECE" && pieceDetails?.parent_listing_id) {
    const { data: parentData } = await supabase
      .from("listings")
      .select(`
        id,
        performance_details (title)
      `)
      .eq("id", pieceDetails.parent_listing_id)
      .single()
    
    if (parentData) {
      const parentPerfDetails = normalizeSupabaseRelation(parentData.performance_details)
      if (parentPerfDetails?.title) {
        if (Array.isArray(listing.piece_details)) {
          if (listing.piece_details[0]) {
            (listing.piece_details[0] as any).parent_listing_title = parentPerfDetails.title
          }
        } else if (listing.piece_details) {
          (listing.piece_details as any).parent_listing_title = parentPerfDetails.title
        }
      }
    }
  }

  const classDetails = normalizeSupabaseRelation(listing.class_workshop_details)
  
  if (listing.type === "class" && classDetails?.class_workshop_type === "CLASS" && classDetails?.parent_listing_id) {
    const { data: parentData } = await supabase
      .from("listings")
      .select(`
        id,
        class_workshop_details!class_workshop_details_listing_id_fkey (title)
      `)
      .eq("id", classDetails.parent_listing_id)
      .single()
    
    if (parentData) {
      const parentClassDetails = normalizeSupabaseRelation(parentData.class_workshop_details)
      if (parentClassDetails?.title) {
        if (Array.isArray(listing.class_workshop_details)) {
          if (listing.class_workshop_details[0]) {
            (listing.class_workshop_details[0] as any).parent_listing_title = parentClassDetails.title
          }
        } else if (listing.class_workshop_details) {
          (listing.class_workshop_details as any).parent_listing_title = parentClassDetails.title
        }
      }
    }
  }
}

/**
 * Generates photo URLs for listing photos based on approval status
 */
export async function generatePhotoUrls(
  photos: Array<{ path: string; id: string; credit?: string | null; sort_order?: number }>,
  status: "pending" | "approved" | "rejected",
  supabase: SupabaseClient
): Promise<Array<{ path: string; id: string; credit?: string | null; sort_order?: number; url?: string | null }>> {
  const isApproved = status === "approved"
  const bucket = isApproved ? "event-photos-public" : "event-photos"
  
  return Promise.all(
    photos.map(async (photo) => {
      if (isApproved) {
        return {
          ...photo,
          url: storageService.getPublicUrl(supabase, bucket, photo.path),
        }
      } else {
        const { data: signed } = await supabase.storage
          .from(bucket)
          .createSignedUrl(photo.path, 3600)
        
        return {
          ...photo,
          url: signed?.signedUrl ?? null,
        }
      }
    })
  )
}

/**
 * Fetches parent listing titles for pieces and classes
 */
export async function fetchParentTitles(
  parentIds: string[],
  supabase: SupabaseClient
): Promise<Record<string, string>> {
  if (parentIds.length === 0) {
    return {}
  }

  const { data: parentData } = await supabase
    .from("listings")
    .select(`
      id,
      type,
      performance_details (title),
      class_workshop_details!class_workshop_details_listing_id_fkey (title)
    `)
    .in("id", parentIds)
  
  if (!parentData) {
    return {}
  }

  return Object.fromEntries(
    parentData.map((p: any) => {
      if (p.type === "performance") {
        const perfDetails = normalizeSupabaseRelation(p.performance_details)
        return [p.id, perfDetails?.title || ""]
      } else if (p.type === "class") {
        const classDetails = normalizeSupabaseRelation(p.class_workshop_details)
        return [p.id, classDetails?.title || ""]
      }
      return [p.id, ""]
    })
  )
}
