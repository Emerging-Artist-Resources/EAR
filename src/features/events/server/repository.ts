import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseServerClientAnon } from "@/lib/supabase/serverAnon"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { storageService } from "@/services/storage"
import type { SupabaseClient } from "@supabase/supabase-js"

export type ListingType = "performance" | "audition" | "creative" | "class" | "funding"

export type ListingStatus = "pending" | "approved" | "rejected" | "draft"

export type OccurrenceType = "event" | "deadline"

export type BaseListingInput = {
  contact_name: string
  pronouns?: string | null
  contact_email: string
  company?: string | null
  company_website?: string | null
  address?: string | null
  place_id?: string | null
  lat?: number | null
  lng?: number | null
  venue_name?: string | null
  location_instructions?: string | null
  social_handles?: string | null
  notes?: string | null
  //borough?: string | null
  meta?: Record<string, unknown>
}

export type OccurrenceInput = {
  starts_at_utc: string
  ends_at_utc?: string | null
  tz: string
  occurrence_type?: OccurrenceType
  address?: string | null
  place_id?: string | null
  lat?: number | null
  lng?: number | null
  venue_name?: string | null
  location_instructions?: string | null
}

export type PhotoInput = {
  path: string
  credit?: string | null
  sort_order?: number
}

export type PieceDetailsInput = {
  parent_listing_id?: string | null
  parent_event_name?: string | null
  parent_event_website?: string | null
  parent_event_ticket_link?: string | null
  parent_event_contact_email?: string | null
  piece_schedule_mode?: string | null
  selected_slots?: string[] | null
}

export type CreateListingInput = {
  type: ListingType
  base: BaseListingInput
  details: Record<string, unknown>
  occurrences: OccurrenceInput[]
  photos?: PhotoInput[]
  piece_details?: PieceDetailsInput | null
  parent_listing_id?: string | null
  relationship_type?: "performance_piece" | "workshop_class"
}

const detailTable: Record<Exclude<ListingType, "funding">, string> = {
  performance: "performance_details",
  audition: "audition_details",
  creative: "creative_details",
  class: "class_workshop_details",
}

/* ------------------------------------------------------------------ */
/* CREATE (authenticated owner)                                        */
/* Owner can edit while status='pending' per RLS                       */
/* ------------------------------------------------------------------ */
export async function createListingOwnedRepo(
  supabase: SupabaseClient,
  input: CreateListingInput
) {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user?.id) {
    throw new Error("Unauthorized")
  }

  let listingId: string | null = null

  try {
    // 1) Insert base listing
    const { data: listing, error: e1 } = await supabase
      .from("listings")
      .insert({
      type: input.type,
        status: "pending",
        created_by: user.id,
        contact_name: input.base.contact_name,
        pronouns: input.base.pronouns ?? null,
        contact_email: input.base.contact_email,
        company: input.base.company ?? null,
        company_website: input.base.company_website ?? null,
        address: input.base.address ?? null,
        place_id: input.base.place_id ?? null,
        lat: input.base.lat ?? null,
        lng: input.base.lng ?? null,
        venue_name: input.base.venue_name ?? null,
        location_instructions: input.base.location_instructions ?? null,
        social_handles: input.base.social_handles ?? null,
        notes: input.base.notes ?? null,
        //borough: input.base.borough ?? null,
        meta: input.base.meta ?? {},
        // submitted_at will be set when user explicitly submits (see submitListingRepo)
      })
      .select("id")
      .single()
    if (e1) {
      throw new Error(`Failed to create listing: ${e1.message}`)
    }

    listingId = listing.id as string

    // 2) Insert type-specific details
    if (input.type === "funding") {
      throw new Error("Funding listings are not currently supported")
    }
    
    const tbl = detailTable[input.type]
    
    // Validate performance_details constraint: ORGANIZER must have title
    if (input.type === "performance" && input.details.subtype === "ORGANIZER") {
      if (!input.details.title) {
        throw new Error("Performance ORGANIZER must have a title")
      }
    }
    
    // For auditions, ensure artist_type is set (required NOT NULL)
    // If not provided in payload, fetch from user's profile
    if (input.type === "audition" && !input.details.artist_type) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("artist_status")
        .eq("id", user.id)
        .single()
      
      if (profile?.artist_status) {
        // Map artist_status (emerging/established) to artist_type (EMERGING/ESTABLISHED)
        input.details.artist_type = profile.artist_status === "established" ? "ESTABLISHED" : "EMERGING"
      } else {
        // Default to EMERGING if profile doesn't have artist_status
        input.details.artist_type = "EMERGING"
      }
    }
    
    const { error: e2 } = await supabase
      .from(tbl)
      .insert({ listing_id: listingId, ...input.details })
    if (e2) throw new Error(`Failed to insert ${tbl} details: ${e2.message}`)

    // 3) Insert occurrences
    if (input.occurrences?.length) {
      const occurrencesToInsert = input.occurrences.map((o) => ({
        listing_id: listingId,
        occurrence_type: o.occurrence_type ?? ("event" as OccurrenceType),
        starts_at_utc: o.starts_at_utc,
        ends_at_utc: o.ends_at_utc ?? null,
        tz: o.tz,
        address: o.address ?? null,
        place_id: o.place_id ?? null,
        lat: o.lat ?? null,
        lng: o.lng ?? null,
        venue_name: o.venue_name ?? null,
        location_instructions: o.location_instructions ?? null,
      }))
      const { error: e3 } = await supabase
        .from("listing_occurrences")
        .insert(occurrencesToInsert)
      if (e3) throw new Error(`Failed to insert occurrences: ${e3.message}`)
    }

    // 4) Insert photos
    if (input.photos?.length) {
      const photosToInsert = input.photos
        .slice(0, 5)
        .map((p, idx) => {
          const sortOrder = p.sort_order ?? idx
          // Ensure sort_order is within valid range (0-9)
          const clampedSortOrder = Math.max(0, Math.min(9, sortOrder))
          return {
            listing_id: listingId,
            path: p.path,
            credit: p.credit ?? null,
            sort_order: clampedSortOrder,
          }
        })
      const { error: e4 } = await supabase
        .from("listing_photos")
        .insert(photosToInsert)
      if (e4) throw new Error(`Failed to insert photos: ${e4.message}`)
    }

    // 5) Insert piece_details if this is a piece
    if (input.piece_details) {
      // Validate piece_details constraint: must have parent_listing_id OR (parent_event_name AND parent_event_contact_email)
      const hasParentListing = !!input.piece_details.parent_listing_id
      const hasManualParent = !!(input.piece_details.parent_event_name && input.piece_details.parent_event_contact_email)
      
      if (!hasParentListing && !hasManualParent) {
        throw new Error("Piece details must have either parent_listing_id or both parent_event_name and parent_event_contact_email")
      }
      
      const { error: e5 } = await supabase
        .from("piece_details")
        .insert({
          listing_id: listingId,
          parent_listing_id: input.piece_details.parent_listing_id ?? null,
          parent_event_name: input.piece_details.parent_event_name ?? null,
          parent_event_website: input.piece_details.parent_event_website ?? null,
          parent_event_ticket_link: input.piece_details.parent_event_ticket_link ?? null,
          parent_event_contact_email: input.piece_details.parent_event_contact_email ?? null,
          piece_schedule_mode: input.piece_details.piece_schedule_mode ?? null,
          selected_slots: input.piece_details.selected_slots || null,
        })
      if (e5) throw new Error(`Failed to insert piece_details: ${e5.message}`)
    }

    // 6) Create parent-child relationship if provided
    // Check both top-level parent_listing_id and piece_details.parent_listing_id
    const parentListingId = input.parent_listing_id || input.piece_details?.parent_listing_id || null
    
    // Auto-determine relationship_type for pieces if not provided
    let relationshipType = input.relationship_type
    if (parentListingId && !relationshipType) {
      // If this is a piece and has parent_listing_id, it's a performance_piece relationship
      if (input.type === "performance" && input.details.subtype === "PIECE") {
        relationshipType = "performance_piece"
      }
      // For classes, would need to check if parent is workshop - handled by admin function
    }
    
    if (parentListingId && relationshipType) {
      const { error: e6 } = await supabase
        .from("listing_relationships")
        .insert({
          parent_listing_id: parentListingId,
          child_listing_id: listingId,
          relationship_type: relationshipType,
          created_by: user.id,
        })
      if (e6) throw new Error(`Failed to create relationship: ${e6.message}`)
    }

    return { id: listingId }
  } catch (error) {
    // Rollback: delete listing if it was created (CASCADE will delete all related data)
    if (listingId) {
      await supabase.from("listings").delete().eq("id", listingId)
    }
    // Re-throw the original error
    throw error
  }
}

/* ------------------------------------------------------------------ */
/* CREATE (anonymous submission)                                       */
/* Use SERVICE client in the API route; this repo assumes it's called  */
/* with a service client available (DI pattern shown below).           */
/* ------------------------------------------------------------------ */
export async function createListingAnonymousRepo(
  serviceSupabase: ReturnType<typeof getSupabaseServiceClient>,
  input: CreateListingInput
) {
  let listingId: string | null = null

  try {
    // 1) Insert listing (created_by = null)
    const { data: listing, error: e1 } = await serviceSupabase
      .from("listings")
      .insert({
        type: input.type,
        status: "pending",
        created_by: null,
        contact_name: input.base.contact_name,
        pronouns: input.base.pronouns ?? null,
        contact_email: input.base.contact_email,
        company: input.base.company ?? null,
        company_website: input.base.company_website ?? null,
        address: input.base.address ?? null,
        place_id: input.base.place_id ?? null,
        lat: input.base.lat ?? null,
        lng: input.base.lng ?? null,
        venue_name: input.base.venue_name ?? null,
        location_instructions: input.base.location_instructions ?? null,
        social_handles: input.base.social_handles ?? null,
        notes: input.base.notes ?? null,
        //borough: input.base.borough ?? null,
        meta: input.base.meta ?? {},
        // submitted_at will be set when user explicitly submits (see submitListingRepo)
      })
      .select("id")
      .single()
    if (e1) throw new Error(`Failed to create listing: ${e1.message}`)

    listingId = listing.id as string

    // 2) Insert type-specific details
    if (input.type === "funding") {
      throw new Error("Funding listings are not currently supported")
    }
    
    const tbl = detailTable[input.type]
    
    // Validate performance_details constraint: ORGANIZER must have title
    if (input.type === "performance" && input.details.subtype === "ORGANIZER") {
      if (!input.details.title) {
        throw new Error("Performance ORGANIZER must have a title")
      }
    }
    
    // For auditions, ensure artist_type is set (required NOT NULL)
    // For anonymous submissions, default to EMERGING if not provided
    if (input.type === "audition" && !input.details.artist_type) {
      input.details.artist_type = "EMERGING"
    }
    
    const { error: e2 } = await serviceSupabase
      .from(tbl)
      .insert({ listing_id: listingId, ...input.details })
    if (e2) throw new Error(`Failed to insert ${tbl} details: ${e2.message}`)

    // 3) Insert occurrences
    if (input.occurrences?.length) {
      const occurrencesToInsert = input.occurrences.map((o) => ({
        listing_id: listingId,
        occurrence_type: o.occurrence_type ?? ("event" as OccurrenceType),
        starts_at_utc: o.starts_at_utc,
        ends_at_utc: o.ends_at_utc ?? null,
        tz: o.tz,
        address: o.address ?? null,
        place_id: o.place_id ?? null,
        lat: o.lat ?? null,
        lng: o.lng ?? null,
        venue_name: o.venue_name ?? null,
        location_instructions: o.location_instructions ?? null,
      }))
      const { error: e3 } = await serviceSupabase
        .from("listing_occurrences")
        .insert(occurrencesToInsert)
      if (e3) throw new Error(`Failed to insert occurrences: ${e3.message}`)
    }

    // 4) Insert photos
    if (input.photos?.length) {
      const photosToInsert = input.photos
        .slice(0, 5)
        .map((p, idx) => {
          const sortOrder = p.sort_order ?? idx
          // Ensure sort_order is within valid range (0-9)
          const clampedSortOrder = Math.max(0, Math.min(9, sortOrder))
          return {
            listing_id: listingId,
            path: p.path,
            credit: p.credit ?? null,
            sort_order: clampedSortOrder,
          }
        })
      const { error: e4 } = await serviceSupabase
        .from("listing_photos")
        .insert(photosToInsert)
      if (e4) throw new Error(`Failed to insert photos: ${e4.message}`)
    }

    // 5) Insert piece_details if this is a piece
    if (input.piece_details) {
      // Validate piece_details constraint: must have parent_listing_id OR (parent_event_name AND parent_event_contact_email)
      const hasParentListing = !!input.piece_details.parent_listing_id
      const hasManualParent = !!(input.piece_details.parent_event_name && input.piece_details.parent_event_contact_email)
      
      if (!hasParentListing && !hasManualParent) {
        throw new Error("Piece details must have either parent_listing_id or both parent_event_name and parent_event_contact_email")
      }
      
      const { error: e5 } = await serviceSupabase
        .from("piece_details")
        .insert({
          listing_id: listingId,
          parent_listing_id: input.piece_details.parent_listing_id ?? null,
          parent_event_name: input.piece_details.parent_event_name ?? null,
          parent_event_website: input.piece_details.parent_event_website ?? null,
          parent_event_ticket_link: input.piece_details.parent_event_ticket_link ?? null,
          parent_event_contact_email: input.piece_details.parent_event_contact_email ?? null,
          piece_schedule_mode: input.piece_details.piece_schedule_mode ?? null,
          selected_slots: input.piece_details.selected_slots || null,
        })
      if (e5) throw new Error(`Failed to insert piece_details: ${e5.message}`)
    }

    // 6) Create parent-child relationship if provided (note: anonymous can't create relationships, admin must do this)
    // Relationships are typically created by admin after both listings exist

    return { id: listingId }
  } catch (error) {
    // Rollback: delete listing if it was created (CASCADE will delete all related data)
    if (listingId) {
      await serviceSupabase.from("listings").delete().eq("id", listingId)
    }
    // Re-throw the original error
    throw error
  }
}

/* ------------------------------------------------------------------ */
/* PUBLIC CALENDAR (approved only)                                     */
/* ------------------------------------------------------------------ */
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
    listings!inner (
      id, type, status,
      performance_details (title),
      audition_details (title),
      creative_details (title),
      class_workshop_details (title)
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

  return (data ?? []).map((row: any) => {
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
      //borough: listing.borough ?? null,
      address: row.address ?? null,
      venue_name: row.venue_name ?? null,
    }
  })
}

/* ------------------------------------------------------------------ */
/* PUBLIC DEADLINES (approved only)                                    */
/* ------------------------------------------------------------------ */
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
    listings!inner (
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

/* ------------------------------------------------------------------ */
/* PUBLIC LISTING (approved)                                           */
/* ------------------------------------------------------------------ */
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
      class_workshop_details (*),
      listing_occurrences (*),
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

/* ------------------------------------------------------------------ */
/* OWNER reads (any status)                                            */
/* ------------------------------------------------------------------ */
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
      class_workshop_details (*),
      piece_details (*),
      listing_occurrences (*),
      listing_photos (*)
    `)
    .eq("id", listingId)
    .is("deleted_at", null)
    .single()

  if (error) throw error
  return data
}

/* ------------------------------------------------------------------ */
/* OWNER: update while pending                                         */
/* ------------------------------------------------------------------ */
export async function updatePendingListingRepo(
  listingId: string,
  patch: {
    base?: Partial<BaseListingInput>
    details?: Record<string, unknown>
  }
) {
  const supabase = await getSupabaseServerClient()

  if (patch.base) {
    const { error } = await supabase
      .from("listings")
      .update(patch.base)
      .eq("id", listingId)
    if (error) throw new Error(`Failed to update listing base: ${error.message}`)
  }
  if (patch.details) {
    const { data: listing, error: e1 } = await supabase
      .from("listings")
      .select("type")
      .eq("id", listingId)
    .single()
    if (e1) throw new Error(`Failed to get listing type: ${e1.message}`)
    
    const listingType = listing.type as ListingType
    if (listingType === "funding") {
      throw new Error("Funding listings are not currently supported")
    }
    
    const tbl = detailTable[listingType]
    const { error: e2 } = await supabase
      .from(tbl)
      .update(patch.details)
      .eq("listing_id", listingId)
    if (e2) throw new Error(`Failed to update ${tbl} details: ${e2.message}`)
  }
}

/* ------------------------------------------------------------------ */
/* OWNER: submit listing (sets submitted_at)                          */
/* ------------------------------------------------------------------ */
export async function submitListingRepo(listingId: string) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) throw new Error("Unauthorized")

  // Verify listing belongs to user and is in draft or pending status
  const { data: listing, error: checkError } = await supabase
    .from("listings")
    .select("id, status, created_by")
    .eq("id", listingId)
    .is("deleted_at", null)
    .single()
  
  if (checkError) throw new Error(`Failed to get listing: ${checkError.message}`)
  if (listing.created_by !== user.id) throw new Error("Unauthorized: Listing does not belong to user")
  if (listing.status !== "draft" && listing.status !== "pending") {
    throw new Error(`Cannot submit listing with status: ${listing.status}`)
  }

  // Set submitted_at and update status to pending if it was draft
  const { error } = await supabase
    .from("listings")
    .update({
      submitted_at: new Date().toISOString(),
      status: "pending", // Ensure status is pending when submitted
    })
    .eq("id", listingId)
  
  if (error) throw new Error(`Failed to submit listing: ${error.message}`)
}

/* ------------------------------------------------------------------ */
/* ADMIN actions                                                       */
/* ------------------------------------------------------------------ */
export async function approveListingRepo(listingId: string, reviewerId: string) {
  const supabase = await getSupabaseServerClient()
  const svc = getSupabaseServiceClient()
  
  // 1) Update listing status
  const { error } = await supabase
    .from("listings")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    })
    .eq("id", listingId)
  if (error) throw new Error(`Failed to approve listing: ${error.message}`)

  // 2) Move photos from private to public bucket
  const { data: photos, error: photosError } = await supabase
    .from("listing_photos")
    .select("id, path")
    .eq("listing_id", listingId)

  if (photosError) {
    console.error(`Failed to fetch photos for listing ${listingId}:`, photosError)
    // Don't fail approval if photos can't be moved
  } else if (photos && photos.length > 0) {
    // Move each photo from private to public bucket
    const privateBucket = "event-photos"
    const publicBucket = "event-photos-public"
    
    for (const photo of photos) {
      try {
        await storageService.moveFile(svc, privateBucket, publicBucket, photo.path)
      } catch (moveError) {
        console.error(`Failed to move photo ${photo.id} (${photo.path}):`, moveError)
        // Continue with other photos even if one fails
      }
    }
  }
}

export async function rejectListingRepo(
  listingId: string,
  reviewerId: string,
  admin_notes?: string
) {
  const supabase = await getSupabaseServerClient()
  
  const updateData: {
    status: string
    reviewed_at: string
    reviewed_by: string
    notes?: string
  } = {
    status: "rejected",
    reviewed_at: new Date().toISOString(),
    reviewed_by: reviewerId,
  }
  
  if (admin_notes) {
    const { data: existing } = await supabase
      .from("listings")
      .select("notes")
      .eq("id", listingId)
      .single()
    updateData.notes = existing?.notes 
      ? `${existing.notes}\n\nAdmin notes: ${admin_notes}`
      : `Admin notes: ${admin_notes}`
  }
  
  const { error } = await supabase
    .from("listings")
    .update(updateData)
    .eq("id", listingId)
  if (error) throw error
}

export async function deleteListingRepo(listingId: string, deletedBy: string) {
  const svc = getSupabaseServiceClient()
  
  const { error } = await svc
    .from("listings")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
  
  if (error) throw new Error(`Failed to delete listing: ${error.message}`)
}

/* ------------------------------------------------------------------ */
/* ADMIN list/detail (service client; API enforces role)               */
/* ------------------------------------------------------------------ */
export async function listAdminListingsRepo(params: {
  status: ListingStatus
  limit: number
}) {
  const svc = getSupabaseServiceClient()
  const { data, error } = await svc
    .from("listings")
    .select(`
      id, type, status, submitted_at,
      performance_details (title),
      audition_details (title),
      creative_details (title),
      class_workshop_details (title)
    `)
    .eq("status", params.status)
    .is("deleted_at", null)
    .order("submitted_at", { ascending: false })
    .limit(params.limit)
  if (error) throw error

  return (data ?? []).map((e: any) => {
    const title =
      e.type === "performance" ? e.performance_details?.title :
      e.type === "audition" ? e.audition_details?.title :
      e.type === "creative" ? e.creative_details?.title :
      e.type === "class" ? e.class_workshop_details?.title :
      "Untitled"
    return {
      id: e.id,
      type: e.type,
      status: e.status,
      submitted_at: e.submitted_at,
      title: title ?? null,
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
      class_workshop_details (*),
      piece_details!piece_details_listing_id_fkey (*),
      listing_occurrences (*),
      listing_photos (*)
    `)
    .eq("id", listingId)
    .is("deleted_at", null)
    .single()
  if (error) throw error

  // Generate URLs for photos
  // Approved listings use public bucket, pending/rejected use private bucket with signed URLs
  if (data.listing_photos && Array.isArray(data.listing_photos) && data.listing_photos.length > 0) {
    const isApproved = data.status === "approved"
    const bucket = isApproved ? "event-photos-public" : "event-photos"
    
    const photosWithUrls = await Promise.all(
      data.listing_photos.map(async (photo: { path: string; id: string; credit?: string | null; sort_order?: number }) => {
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
    data.listing_photos = photosWithUrls
  }

  return data
}

/* ------------------------------------------------------------------ */
/* LEGACY COMPATIBILITY - Keep for backward compatibility             */
/* These functions map old names to new names                         */
/* ------------------------------------------------------------------ */
export async function createEventOwnedRepo(
  supabase: SupabaseClient,
  input: Parameters<typeof createListingOwnedRepo>[1]
) {
  return createListingOwnedRepo(supabase, input)
}

export async function createEventAnonymousRepo(
  serviceSupabase: ReturnType<typeof getSupabaseServiceClient>,
  input: Parameters<typeof createListingAnonymousRepo>[1]
) {
  return createListingAnonymousRepo(serviceSupabase, input)
}

export async function listEvents(params: {
  status?: string | null
  userId?: string | null
  limit?: number
  cursor?: string | null
}) {
  const supabase = await getSupabaseServerClient()
  let query = supabase.from("listings").select("*").is("deleted_at", null)
  if (params.status) query = query.eq("status", params.status)
  if (params.userId) query = query.eq("created_by", params.userId)
  query = query.order("submitted_at", { ascending: false })
  const limit = params.limit && params.limit > 0 ? params.limit : 20
  query = query.range(0, Math.max(0, limit - 1))
  const { data, error } = await query
  if (error) throw error
  return { items: data, nextCursor: null }
}

export async function getEventPublicRepo(listingId: string) {
  return getListingPublicRepo(listingId)
}

export async function getEventForOwnerRepo(listingId: string) {
  return getListingForOwnerRepo(listingId)
}

export async function listMyEventsRepo() {
  return listMyListingsRepo()
}

export async function updatePendingEventRepo(
  listingId: string,
  patch: Parameters<typeof updatePendingListingRepo>[1]
) {
  return updatePendingListingRepo(listingId, patch)
}

export async function approveEventRepo(listingId: string, reviewerId: string) {
  return approveListingRepo(listingId, reviewerId)
}

export async function rejectEventRepo(
  listingId: string,
  reviewerId: string,
  admin_notes?: string
) {
  return rejectListingRepo(listingId, reviewerId, admin_notes)
}

export async function listAdminEventsRepo(params: {
  status: "pending" | "approved" | "rejected"
  limit: number
}) {
  return listAdminListingsRepo(params)
}

export async function getAdminEventDetailRepo(listingId: string) {
  return getAdminListingDetailRepo(listingId)
}
