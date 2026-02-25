import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import type {
  CreateListingInput,
  OccurrenceType,
} from "./repository-types"
import { detailTable } from "./repository-types"

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
        meta: input.base.meta ?? {},
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
      // Validate piece_details constraint: must have parent_listing_id OR parent_event_name
      const hasParentListing = !!input.piece_details.parent_listing_id
      const hasManualParent = !!input.piece_details.parent_event_name
      
      if (!hasParentListing && !hasManualParent) {
        throw new Error("Piece details must have either parent_listing_id or parent_event_name")
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
          piece_title: input.piece_details.piece_title ?? null,
          piece_company: input.piece_details.piece_company ?? null,
          piece_company_website: input.piece_details.piece_company_website ?? null,
          piece_description: input.piece_details.piece_description ?? null,
          choreographer: input.piece_details.choreographer ?? null,
        })
      if (e5) throw new Error(`Failed to insert piece_details: ${e5.message}`)
    }

    // 6) Create parent-child relationship if provided
    // Check top-level parent_listing_id, piece_details.parent_listing_id, or class_workshop_details.parent_listing_id
    const parentListingId = input.parent_listing_id || 
      input.piece_details?.parent_listing_id || 
      (input.details as any).parent_listing_id || 
      null
    
    // Auto-determine relationship_type if not provided
    let relationshipType = input.relationship_type
    if (parentListingId && !relationshipType) {
      // If this is a piece and has parent_listing_id, it's a performance_piece relationship
      if (input.type === "performance" && input.details.subtype === "PIECE") {
        relationshipType = "performance_piece"
      }
      // If this is a class and has parent_listing_id, it's a workshop_class relationship
      else if (input.type === "class" && (input.details as any).class_workshop_type === "CLASS") {
        relationshipType = "workshop_class"
      }
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
        meta: input.base.meta ?? {},
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
      // Validate piece_details constraint: must have parent_listing_id OR parent_event_name
      const hasParentListing = !!input.piece_details.parent_listing_id
      const hasManualParent = !!input.piece_details.parent_event_name
      
      if (!hasParentListing && !hasManualParent) {
        throw new Error("Piece details must have either parent_listing_id or parent_event_name")
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
          piece_title: input.piece_details.piece_title ?? null,
          piece_company: input.piece_details.piece_company ?? null,
          piece_company_website: input.piece_details.piece_company_website ?? null,
          piece_description: input.piece_details.piece_description ?? null,
          choreographer: input.piece_details.choreographer ?? null,
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
