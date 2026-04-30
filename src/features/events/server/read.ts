import { getSupabaseServerClientAnon } from "@/lib/supabase/serverAnon"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { storageService } from "@/services/storage"
import type { ListingType } from "./repository-types"
import { normalizeSupabaseRelation } from "./admin-utils"

const MIN_SEARCH_QUERY_LENGTH = 2
const MIN_SEARCH_SCORE = 30

type SearchScoreResult = {
  score: number
  tokenCoverageRatio: number
  hasPrefixMatch: boolean
  allTokensPresent: boolean
}

function getListingTitle(listing: any): string | null {
  if (listing.type === "performance") return listing.performance_details?.title ?? null
  if (listing.type === "audition") return listing.audition_details?.title ?? null
  if (listing.type === "creative") return listing.creative_details?.title ?? null
  if (listing.type === "class") {
    const classDetails = normalizeSupabaseRelation(listing.class_workshop_details)
    return classDetails?.title ?? null
  }
  return null
}

export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function tokenizeSearchText(text: string): string[] {
  return normalizeSearchText(text).split(" ").filter(Boolean)
}

export function scoreListingTitleMatch(normalizedQuery: string, normalizedTitle: string): SearchScoreResult {
  const queryTokens = tokenizeSearchText(normalizedQuery)
  const titleTokens = tokenizeSearchText(normalizedTitle)

  if (!queryTokens.length || !titleTokens.length) {
    return { score: 0, tokenCoverageRatio: 0, hasPrefixMatch: false, allTokensPresent: false }
  }

  let score = 0

  if (normalizedTitle === normalizedQuery) {
    score += 100
  } else if (normalizedTitle.startsWith(normalizedQuery)) {
    score += 80
  } else if (normalizedTitle.includes(normalizedQuery)) {
    score += 60
  }

  const matchedTokens = queryTokens.filter((queryToken) =>
    titleTokens.some((titleToken) => titleToken.includes(queryToken))
  ).length

  const tokenCoverageRatio = matchedTokens / queryTokens.length
  score += tokenCoverageRatio * 50

  const allTokensPresent = matchedTokens === queryTokens.length
  if (allTokensPresent) {
    score += 20
  }

  const hasPrefixMatch = queryTokens.some((queryToken) =>
    titleTokens.some((titleToken) => titleToken.startsWith(queryToken))
  )
  if (hasPrefixMatch) {
    score += 10
  }

  // Optional polish: boost clean word-boundary hits on short terms.
  if (` ${normalizedTitle}`.includes(` ${normalizedQuery}`)) {
    score += 10
  }

  return {
    score,
    tokenCoverageRatio,
    hasPrefixMatch,
    allTokensPresent,
  }
}

export async function searchListingsRepo(params: {
  query: string
  types?: ListingType[]
  limit?: number
}) {
  const supabase = getSupabaseServerClientAnon()
  const { query, types = [], limit = 20 } = params
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery || normalizedQuery.length < MIN_SEARCH_QUERY_LENGTH) {
    return []
  }

  const sel = `
    id, type, status,
    performance_details (title, subtype),
    audition_details (title),
    creative_details (title),
    class_workshop_details!class_workshop_details_listing_id_fkey (title, class_workshop_type),
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
      
      // For class type, only show WORKSHOP types (not CLASS)
      if (listing.type === "class") {
        const classDetails = normalizeSupabaseRelation(listing.class_workshop_details)
        if (classDetails?.class_workshop_type !== "WORKSHOP") {
          return false
        }
      }

      return true
    })
    .map((listing: any) => {
      const title = getListingTitle(listing) ?? "Untitled"
      const normalizedTitle = normalizeSearchText(title)
      const { score, tokenCoverageRatio } = scoreListingTitleMatch(normalizedQuery, normalizedTitle)

      // Hybrid threshold: reject weak fuzzy matches but keep strong signal hits.
      const failsThreshold = score < MIN_SEARCH_SCORE || (tokenCoverageRatio < 0.3 && score < 60)

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
        _score: score,
        _failsThreshold: failsThreshold,
      }
    })
    .filter((item: any) => !item._failsThreshold)
    .sort((a: any, b: any) => {
      if (b._score !== a._score) return b._score - a._score

      const aTime = a.start ? new Date(a.start).getTime() : Number.MAX_SAFE_INTEGER
      const bTime = b.start ? new Date(b.start).getTime() : Number.MAX_SAFE_INTEGER
      if (aTime !== bTime) return aTime - bTime

      return (a.title ?? "").localeCompare(b.title ?? "")
    })
    .map(({ _score, _failsThreshold, ...item }: any) => item)
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
      class_workshop_details!class_workshop_details_listing_id_fkey (title, class_workshop_type, parent_workshop_name, parent_listing_id),
      piece_details!piece_details_listing_id_fkey (parent_event_name, parent_listing_id, piece_title, piece_company)
    )
  `

  let q = supabase
    .from("listing_occurrences")
    .select(sel)
    .eq("listings.status", "approved")
    .is("listings.deleted_at", null)
    .gte("starts_at_utc", fromISO)
    .lte("starts_at_utc", toISO)
    .order("starts_at_utc", { ascending: true })
    .limit(Math.min(limit, 1000))

  // Include both events and deadlines (deadlines only for creative should appear on calendar)
  q = q.or("occurrence_type.eq.event,occurrence_type.eq.deadline")

  if (types.length) q = q.in("listings.type", types)

  const { data, error } = await q
  if (error) throw error

  return (data ?? [])
    .filter((row: any) => {
      // For deadlines, only show creative type on calendar (auditions stay on event date)
      if (row.occurrence_type === "deadline") {
        return row.listings?.type === "creative"
      }
      
      if (row.listings?.type === "performance") {
        const subtype = row.listings.performance_details?.subtype
        if (subtype === "PIECE") {
          // Allow pieces with parent_event_name but no parent_listing_id
          const pieceDetails = normalizeSupabaseRelation(row.listings.piece_details)
          return pieceDetails?.parent_event_name && !pieceDetails?.parent_listing_id
        }
        return subtype === "ORGANIZER"
      }
      if (row.listings?.type === "class") {
        const classDetails = normalizeSupabaseRelation(row.listings.class_workshop_details)
        if (classDetails?.class_workshop_type === "CLASS") {
          // Allow classes with parent_workshop_name but no parent_listing_id
          return classDetails?.parent_workshop_name && !classDetails?.parent_listing_id
        }
        // Show all workshops (class_workshop_type === "WORKSHOP")
        return classDetails?.class_workshop_type === "WORKSHOP"
      }
      return true
    })
    .map((row: any) => {
      const listing = row.listings
      let title: string
      
      if (listing.type === "performance" && listing.performance_details?.subtype === "PIECE") {
        // Use getListingTitle logic for pieces
        const pieceDetails = normalizeSupabaseRelation(listing.piece_details)
        const pieceTitle = pieceDetails?.piece_title || pieceDetails?.piece_company
        const parentName = pieceDetails?.parent_event_name
        if (parentName && pieceTitle) {
          title = `${parentName} - ${pieceTitle}`
        } else {
          title = pieceTitle || parentName || "Untitled Piece"
        }
      } else {
        // Existing logic for other types
        title = listing.type === "performance" ? listing.performance_details?.title :
                listing.type === "audition" ? listing.audition_details?.title :
                listing.type === "creative" ? listing.creative_details?.title :
                listing.type === "class" ? listing.class_workshop_details?.title :
                "Untitled"
      }
      
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
      piece_details!piece_details_listing_id_fkey (*),
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

export async function listMyListingsRepo(page: number = 0, limit: number = 10) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) throw new Error("Unauthorized")

  // Get total count
  const { count } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("created_by", user.id)
    .is("deleted_at", null)

  // Get paginated listings
  const { data, error } = await supabase
    .from("listings")
    .select(`id, type, status, submitted_at, payment_required, payment_status, payment_amount`)
    .eq("created_by", user.id)
    .is("deleted_at", null)
    .order("submitted_at", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (error) throw error
  return { listings: data || [], total: count || 0 }
}

export async function getListingForOwnerRepo(listingId: string) {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from("listings")
    .select(`
      id, type, status, social_handles, notes, submitted_at, meta,
      company, company_website, address, place_id, lat, lng, venue_name, location_instructions,
      payment_required, payment_amount, payment_currency, payment_status,
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
  return data
}
