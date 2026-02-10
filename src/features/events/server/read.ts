import { getSupabaseServerClientAnon } from "@/lib/supabase/serverAnon"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { storageService } from "@/services/storage"
import type { ListingType } from "./repository-types"

export async function searchListingsRepo(params: {
  query: string
  types?: ListingType[]
  limit?: number
}) {
  const supabase = getSupabaseServerClientAnon()
  const { query, types = [], limit = 20 } = params

  const sel = `
    id, type, status,
    performance_details (title, subtype),
    audition_details (title),
    creative_details (title),
    class_workshop_details!class_workshop_details_listing_id_fkey (title),
    listing_occurrences!listing_occurrences_listing_id_fkey (
      id, starts_at_utc, tz
    )
  `

  let q = supabase
    .from("listings")
    .select(sel)
    .eq("status", "approved")
    .is("deleted_at", null)
    .limit(Math.min(limit, 100))

  if (types.length) {
    q = q.in("type", types)
  }
  
  // Note: Search filtering by title is done in JavaScript after fetching
  // because Supabase doesn't support direct ilike on joined detail tables
  // For better performance, we could use a full-text search or create a search function

  const { data, error } = await q
  if (error) throw error

  // Filter by search query, subtype (for performances), and get earliest occurrence date for display
  const results = (data ?? [])
    .filter((listing: any) => {
      // For performance type, only show ORGANIZER performances (not PIECE)
      if (listing.type === "performance") {
        if (listing.performance_details?.subtype !== "ORGANIZER") {
          return false
        }
      }
      
      // Filter by search query if provided
      if (!query.trim()) return true
      
      const queryLower = query.toLowerCase().trim()
      const title =
        listing.type === "performance" ? listing.performance_details?.title :
        listing.type === "audition" ? listing.audition_details?.title :
        listing.type === "creative" ? listing.creative_details?.title :
        listing.type === "class" ? listing.class_workshop_details?.title :
        null
      
      return title?.toLowerCase().includes(queryLower)
    })
    .map((listing: any) => {
      const title =
        listing.type === "performance" ? listing.performance_details?.title :
        listing.type === "audition" ? listing.audition_details?.title :
        listing.type === "creative" ? listing.creative_details?.title :
        listing.type === "class" ? listing.class_workshop_details?.title :
        "Untitled"
      
      // Get earliest occurrence for display
      const occurrences = listing.listing_occurrences || []
      const earliestOccurrence = occurrences
        .filter((occ: any) => occ.starts_at_utc)
        .sort((a: any, b: any) => new Date(a.starts_at_utc).getTime() - new Date(b.starts_at_utc).getTime())[0]

      return {
        listingId: listing.id,
        type: listing.type as ListingType,
        title,
        start: earliestOccurrence?.starts_at_utc || null,
        tz: earliestOccurrence?.tz || null,
      }
    })
    .slice(0, limit)

  return results
}

export async function listCalendarItemsRepo(params: {
  fromISO: string
  toISO: string
  types?: ListingType[]
  limit?: number
}) {
  const supabase = getSupabaseServerClientAnon()
  const { fromISO, toISO, types = [], limit = 500 } = params

  const sel = `
    id, listing_id, occurrence_type, starts_at_utc, ends_at_utc, tz,
    address, place_id, lat, lng, venue_name, location_instructions,
    listings!listing_occurrences_listing_id_fkey!inner (
      id, type, status,
      performance_details (title, subtype),
      audition_details (title),
      creative_details (title),
      class_workshop_details!class_workshop_details_listing_id_fkey (title)
    )
  `

  let q = supabase
    .from("listing_occurrences")
    .select(sel)
    .eq("listings.status", "approved")
    .is("listings.deleted_at", null)
    .eq("occurrence_type", "event")
    .gte("starts_at_utc", fromISO)
    .lte("starts_at_utc", toISO)
    .order("starts_at_utc", { ascending: true })
    .limit(Math.min(limit, 1000))

  if (types.length) q = q.in("listings.type", types)

  const { data, error } = await q
  if (error) throw error

  return (data ?? [])
    .filter((row: any) => {
      // For performance type, only show ORGANIZER performances (not PIECE)
      // PIECE performances are children and shouldn't appear in parent event search
      if (row.listings?.type === "performance") {
        return row.listings.performance_details?.subtype === "ORGANIZER"
      }
      return true
    })
    .map((row: any) => {
      const listing = row.listings
      const title =
        listing.type === "performance" ? listing.performance_details?.title :
        listing.type === "audition" ? listing.audition_details?.title :
        listing.type === "creative" ? listing.creative_details?.title :
        listing.type === "class" ? listing.class_workshop_details?.title :
        "Untitled"
      return {
        occurrenceId: row.id,
        listingId: row.listing_id,
        type: listing.type as ListingType,
        title,
        start: row.starts_at_utc as string,
        endsAt: row.ends_at_utc as string | null,
        tz: row.tz as string,
        address: row.address ?? null,
        venue_name: row.venue_name ?? null,
      }
    })
}

export async function listDeadlinesRepo(params: {
  fromISO: string
  toISO: string
  types?: ListingType[] | undefined
  limit?: number
}) {
  const supabase = getSupabaseServerClientAnon()
  const { fromISO, toISO, types, limit = 100 } = params

  const sel = `
    id, listing_id, occurrence_type, starts_at_utc, ends_at_utc, tz,
    listings!listing_occurrences_listing_id_fkey!inner (
      id, type, status,
      audition_details (title),
      creative_details (title)
    )
  `

  let q = supabase
    .from("listing_occurrences")
    .select(sel)
    .eq("listings.status", "approved")
    .is("listings.deleted_at", null)
    .eq("occurrence_type", "deadline")
    .gte("starts_at_utc", fromISO)
    .lte("starts_at_utc", toISO)
    .order("starts_at_utc", { ascending: true })
    .limit(Math.min(limit, 1000))

  if (types && types.length > 0) q = q.in("listings.type", types)

  const { data, error } = await q
  if (error) throw error

  return (data ?? []).map((row: any) => {
    const listing = row.listings
    const title =
      listing.type === "audition" ? listing.audition_details?.title :
      listing.type === "creative" ? listing.creative_details?.title :
      "Untitled"
    return {
      occurrenceId: row.id,
      listingId: row.listing_id,
      type: listing.type as ListingType,
      title,
      start: row.starts_at_utc as string,
      endsAt: row.ends_at_utc as string | null,
      tz: row.tz as string,
      address: null,
      venue_name: null,
    }
  })
}

export async function getListingPublicRepo(listingId: string) {
  const supabase = getSupabaseServerClientAnon()
  const { data, error } = await supabase
    .from("listings")
    .select(`
      id, type, status, social_handles, notes, submitted_at,
      company, company_website, address, place_id, lat, lng, venue_name, location_instructions,
      performance_details (*),
      audition_details (*),
      creative_details (*),
      class_workshop_details!class_workshop_details_listing_id_fkey (*),
      listing_occurrences!listing_occurrences_listing_id_fkey (*),
      listing_photos (*)
    `)
    .eq("id", listingId)
    .eq("status", "approved")
    .is("deleted_at", null)
    .single()

  if (error) throw error

  // Generate public URLs for photos (approved listings use public bucket)
  if (data.listing_photos && Array.isArray(data.listing_photos) && data.listing_photos.length > 0) {
    const svc = getSupabaseServiceClient()
    const publicBucket = "event-photos-public"
    
    data.listing_photos = data.listing_photos.map((photo: { path: string; id: string; credit?: string | null; sort_order?: number }) => ({
      ...photo,
      url: storageService.getPublicUrl(svc, publicBucket, photo.path),
    }))
  }

  return data
}

export async function listMyListingsRepo() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) throw new Error("Unauthorized")

  const { data, error } = await supabase
    .from("listings")
    .select(`id, type, status, submitted_at`)
    .eq("created_by", user.id)
    .is("deleted_at", null)
    .order("submitted_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getListingForOwnerRepo(listingId: string) {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from("listings")
    .select(`
      id, type, status, social_handles, notes, submitted_at,
      company, company_website, address, place_id, lat, lng, venue_name, location_instructions,
      performance_details (*),
      audition_details (*),
      creative_details (*),
      class_workshop_details!class_workshop_details_listing_id_fkey (*),
      piece_details (*),
      listing_occurrences!listing_occurrences_listing_id_fkey (*),
      listing_photos (*)
    `)
    .eq("id", listingId)
    .is("deleted_at", null)
    .single()

  if (error) throw error
  return data
}
