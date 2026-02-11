import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { storageService } from "@/services/storage"
import type { ListingStatus, ListingType } from "./repository-types"
import type { SupabaseClient } from "@supabase/supabase-js"
import { convertUTCToEST } from "@/lib/datetime-utils"
import { sendListingUpdateEmail } from "./service"
import { getListingTitle } from "./listing-utils"
import type { PublicListingDetail } from "@/components/calendar/PublicListingDetailSections"

/**
 * Adds custom occurrences from a piece to its parent event
 * Only adds occurrences if:
 * - Piece has piece_schedule_mode = 'CUSTOM' or has custom occurrences in FROM_PARENT mode
 * - Parent listing exists and is a performance ORGANIZER
 * - Occurrences don't already exist on parent (duplicate check)
 * - For FROM_PARENT mode: occurrences are NOT in selected_slots (those are already on parent)
 */
async function addPieceOccurrencesToParent(
  supabase: SupabaseClient,
  pieceListingId: string
): Promise<void> {
  console.log(`[Piece Occurrence Sync] Checking piece ${pieceListingId} for occurrence sync`)
  
  // 1. Check if this is a piece and get schedule mode + selected_slots
  const { data: pieceData, error: pieceError } = await supabase
    .from("piece_details")
    .select("parent_listing_id, piece_schedule_mode, selected_slots")
    .eq("listing_id", pieceListingId)
    .single()

  if (pieceError || !pieceData) {
    console.log(`[Piece Occurrence Sync] Not a piece or no piece details for ${pieceListingId}:`, pieceError?.message || 'no data')
    return
  }

  console.log(`[Piece Occurrence Sync] Piece ${pieceListingId} has schedule mode: ${pieceData.piece_schedule_mode}`)
  const selectedSlots = (pieceData.selected_slots as string[] | null) || []
  console.log(`[Piece Occurrence Sync] Piece has ${selectedSlots.length} selected slots:`, selectedSlots)

  const parentListingId = pieceData.parent_listing_id
  if (!parentListingId) {
    console.log(`[Piece Occurrence Sync] Skipping - piece ${pieceListingId} has no parent listing`)
    return
  }

  console.log(`[Piece Occurrence Sync] Piece ${pieceListingId} has parent: ${parentListingId}`)

  // 2. Verify parent is a performance ORGANIZER
  const { data: parentData, error: parentError } = await supabase
    .from("performance_details")
    .select("subtype")
    .eq("listing_id", parentListingId)
    .single()

  if (parentError || !parentData || parentData.subtype !== "ORGANIZER") {
    console.log(`[Piece Occurrence Sync] Parent ${parentListingId} is not a performance ORGANIZER:`, parentError?.message || `subtype is ${parentData?.subtype}`)
    return
  }

  console.log(`[Piece Occurrence Sync] Parent ${parentListingId} verified as ORGANIZER`)

  // 3. Get piece's occurrences
  let pieceOccurrences: any[] | null = null
  let occurrencesError: any = null
  
  // Try to query with source_piece_listing_id filter (if column exists)
  const { data: occurrencesWithFilter, error: filterError } = await supabase
    .from("listing_occurrences")
    .select("*")
    .eq("listing_id", pieceListingId)
    .is("source_piece_listing_id", null)
  
  if (filterError) {
    // Column might not exist yet - try without the filter
    console.log(`[Piece Occurrence Sync] Column source_piece_listing_id may not exist, trying without filter:`, filterError.message)
    const { data: occurrencesWithoutFilter, error: noFilterError } = await supabase
      .from("listing_occurrences")
      .select("*")
      .eq("listing_id", pieceListingId)
    
    pieceOccurrences = occurrencesWithoutFilter
    occurrencesError = noFilterError
  } else {
    pieceOccurrences = occurrencesWithFilter
    occurrencesError = null
  }

  if (occurrencesError || !pieceOccurrences || pieceOccurrences.length === 0) {
    console.log(`[Piece Occurrence Sync] No occurrences found for piece ${pieceListingId}:`, occurrencesError?.message || 'no occurrences')
    return
  }

  console.log(`[Piece Occurrence Sync] Found ${pieceOccurrences.length} occurrences for piece ${pieceListingId}`)

  // 4. Get parent's existing occurrences to check for duplicates
  const { data: parentOccurrences, error: parentOccurrencesError } = await supabase
    .from("listing_occurrences")
    .select("starts_at_utc, address, place_id, venue_name, location_instructions")
    .eq("listing_id", parentListingId)

  if (parentOccurrencesError) {
    console.error(`[Piece Occurrence Sync] Failed to fetch parent occurrences: ${parentOccurrencesError.message}`)
    return
  }

  console.log(`[Piece Occurrence Sync] Parent ${parentListingId} has ${parentOccurrences?.length || 0} existing occurrences`)

  // 5. Parse selected_slots to identify which occurrences are from parent selections
  const selectedSlotKeys = new Set(selectedSlots) // Format: "YYYY-MM-DD|HH:mm"
  console.log(`[Piece Occurrence Sync] Selected slots set:`, Array.from(selectedSlotKeys))

  // 6. Filter occurrences to add based on schedule mode
  let occurrencesToAdd: typeof pieceOccurrences = []
  
  if (pieceData.piece_schedule_mode === "CUSTOM" || pieceData.piece_schedule_mode === null) {
    // CUSTOM mode or null (admin-linked pieces): all piece occurrences are custom and should be added (after duplicate check)
    const modeLabel = pieceData.piece_schedule_mode === null ? "null (admin-linked)" : "CUSTOM"
    console.log(`[Piece Occurrence Sync] ${modeLabel} mode - checking all occurrences for duplicates`)
    occurrencesToAdd = pieceOccurrences.filter((pieceOcc) => {
      // Check if this occurrence already exists on parent
      const isDuplicate = parentOccurrences?.some((parentOcc) => {
        // Match by starts_at_utc and location fields
        const timeMatch = parentOcc.starts_at_utc === pieceOcc.starts_at_utc
        const addressMatch = (parentOcc.address || null) === (pieceOcc.address || null)
        const placeIdMatch = (parentOcc.place_id || null) === (pieceOcc.place_id || null)
        const venueMatch = (parentOcc.venue_name || null) === (pieceOcc.venue_name || null)
        const instructionsMatch = (parentOcc.location_instructions || null) === (pieceOcc.location_instructions || null)

        return timeMatch && addressMatch && placeIdMatch && venueMatch && instructionsMatch
      })

      if (isDuplicate) {
        console.log(`[Piece Occurrence Sync] Duplicate occurrence found: ${pieceOcc.starts_at_utc} at ${pieceOcc.venue_name || pieceOcc.address || 'unknown location'}`)
      }

      return !isDuplicate
    })
  } else if (pieceData.piece_schedule_mode === "FROM_PARENT") {
    // FROM_PARENT mode: only add occurrences that are NOT in selected_slots (these are custom additions)
    console.log(`[Piece Occurrence Sync] FROM_PARENT mode - filtering out selected slots, only adding custom occurrences`)
    
    occurrencesToAdd = pieceOccurrences.filter((pieceOcc) => {
      // Convert occurrence to slot key format to check against selected_slots
      const { date, time } = convertUTCToEST(pieceOcc.starts_at_utc)
      const slotKey = `${date}|${time}`
      
      // If this matches a selected slot, it's from parent selection (don't add to parent)
      if (selectedSlotKeys.has(slotKey)) {
        console.log(`[Piece Occurrence Sync] Occurrence ${pieceOcc.starts_at_utc} matches selected slot ${slotKey} - skipping (already on parent)`)
        return false
      }
      
      // This is a custom occurrence - check if it already exists on parent (might have been added manually)
      const existsOnParent = parentOccurrences?.some((parentOcc) => {
        // Match by starts_at_utc and location fields
        const timeMatch = parentOcc.starts_at_utc === pieceOcc.starts_at_utc
        const addressMatch = (parentOcc.address || null) === (pieceOcc.address || null)
        const placeIdMatch = (parentOcc.place_id || null) === (pieceOcc.place_id || null)
        const venueMatch = (parentOcc.venue_name || null) === (pieceOcc.venue_name || null)
        const instructionsMatch = (parentOcc.location_instructions || null) === (pieceOcc.location_instructions || null)

        return timeMatch && addressMatch && placeIdMatch && venueMatch && instructionsMatch
      })

      if (!existsOnParent) {
        console.log(`[Piece Occurrence Sync] Custom occurrence found (not in selected slots, not on parent): ${pieceOcc.starts_at_utc} at ${pieceOcc.venue_name || pieceOcc.address || 'unknown location'}`)
      } else {
        console.log(`[Piece Occurrence Sync] Custom occurrence already exists on parent: ${pieceOcc.starts_at_utc}`)
      }

      return !existsOnParent
    })
  } else {
    console.log(`[Piece Occurrence Sync] Unknown schedule mode: ${pieceData.piece_schedule_mode} - skipping`)
    return
  }

  if (occurrencesToAdd.length === 0) {
    console.log(`[Piece Occurrence Sync] No custom occurrences to add (all ${pieceOccurrences.length} occurrences already exist on parent or are from parent)`)
    return
  }

  console.log(`[Piece Occurrence Sync] Adding ${occurrencesToAdd.length} custom occurrences to parent ${parentListingId} (${pieceOccurrences.length - occurrencesToAdd.length} already exist on parent)`)

  // 6. Insert occurrences into parent with source tracking
  // Build base occurrence data
  const baseOccurrences = occurrencesToAdd.map((occ) => ({
    listing_id: parentListingId,
    occurrence_type: occ.occurrence_type,
    starts_at_utc: occ.starts_at_utc,
    ends_at_utc: occ.ends_at_utc,
    tz: occ.tz,
    address: occ.address,
    place_id: occ.place_id,
    lat: occ.lat,
    lng: occ.lng,
    venue_name: occ.venue_name,
    location_instructions: occ.location_instructions,
  }))

  // Try to add source_piece_listing_id if column exists
  // First, try inserting with source_piece_listing_id
  const occurrencesWithSource = baseOccurrences.map(occ => ({
    ...occ,
    source_piece_listing_id: pieceListingId,
  }))

  console.log(`[Piece Occurrence Sync] Inserting ${occurrencesWithSource.length} occurrences:`, occurrencesWithSource.map(occ => ({
    starts_at_utc: occ.starts_at_utc,
    venue: occ.venue_name || occ.address || 'unknown',
    source_piece: occ.source_piece_listing_id
  })))

  let insertError: any = null
  // Use regular supabase client - RLS policy should allow admin inserts
  const { error: insertErrorWithSource } = await supabase
    .from("listing_occurrences")
    .insert(occurrencesWithSource)

  if (insertErrorWithSource) {
    // If source_piece_listing_id column doesn't exist, try without it
    if (insertErrorWithSource.message?.includes('source_piece_listing_id') || 
        insertErrorWithSource.message?.includes('column') ||
        insertErrorWithSource.code === '42703') {
      console.log(`[Piece Occurrence Sync] source_piece_listing_id column may not exist, trying without it:`, insertErrorWithSource.message)
      
      const { error: insertErrorWithoutSource } = await supabase
        .from("listing_occurrences")
        .insert(baseOccurrences)
      
      if (insertErrorWithoutSource) {
        insertError = insertErrorWithoutSource
        console.error(`[Piece Occurrence Sync] Failed to add piece occurrences to parent (without source tracking): ${insertErrorWithoutSource.message}`)
      } else {
        console.log(`[Piece Occurrence Sync] Successfully added ${baseOccurrences.length} occurrences to parent ${parentListingId} (without source tracking - migration not run)`)
      }
    } else {
      insertError = insertErrorWithSource
      console.error(`[Piece Occurrence Sync] Failed to add piece occurrences to parent: ${insertErrorWithSource.message}`, insertErrorWithSource)
    }
  } else {
    console.log(`[Piece Occurrence Sync] Successfully added ${occurrencesWithSource.length} occurrences to parent ${parentListingId}`)
  }

  if (insertError) {
    // Don't throw - approval should still succeed even if this fails
    console.error(`[Piece Occurrence Sync] Final error - occurrences not added:`, insertError)
  }
}

/**
 * Adds custom occurrences from a class to its parent workshop
 * Only adds occurrences if:
 * - Class has parent_listing_id
 * - Parent listing exists and is a WORKSHOP
 * - Occurrences don't already exist on parent (duplicate check)
 */
async function addClassOccurrencesToParent(
  supabase: SupabaseClient,
  classListingId: string
): Promise<void> {
  console.log(`[Class Occurrence Sync] Checking class ${classListingId} for occurrence sync`)
  
  // 1. Check if this is a class and get parent_listing_id
  const { data: classData, error: classError } = await supabase
    .from("class_workshop_details")
    .select("parent_listing_id, class_workshop_type")
    .eq("listing_id", classListingId)
    .single()

  if (classError || !classData) {
    console.log(`[Class Occurrence Sync] Not a class or no class details for ${classListingId}:`, classError?.message || 'no data')
    return
  }

  if (classData.class_workshop_type !== "CLASS") {
    console.log(`[Class Occurrence Sync] Skipping - listing ${classListingId} is not a CLASS`)
    return
  }

  const parentListingId = classData.parent_listing_id
  if (!parentListingId) {
    console.log(`[Class Occurrence Sync] Skipping - class ${classListingId} has no parent listing`)
    return
  }

  console.log(`[Class Occurrence Sync] Class ${classListingId} has parent: ${parentListingId}`)

  // 2. Verify parent is a WORKSHOP
  const { data: parentData, error: parentError } = await supabase
    .from("class_workshop_details")
    .select("class_workshop_type")
    .eq("listing_id", parentListingId)
    .single()

  if (parentError || !parentData || parentData.class_workshop_type !== "WORKSHOP") {
    console.log(`[Class Occurrence Sync] Parent ${parentListingId} is not a WORKSHOP:`, parentError?.message || `type is ${parentData?.class_workshop_type}`)
    return
  }

  console.log(`[Class Occurrence Sync] Parent ${parentListingId} verified as WORKSHOP`)

  // 3. Get class's occurrences
  const { data: classOccurrences, error: occurrencesError } = await supabase
    .from("listing_occurrences")
    .select("*")
    .eq("listing_id", classListingId)
    .is("source_class_listing_id", null)

  if (occurrencesError || !classOccurrences || classOccurrences.length === 0) {
    console.log(`[Class Occurrence Sync] No occurrences found for class ${classListingId}:`, occurrencesError?.message || 'no occurrences')
    return
  }

  console.log(`[Class Occurrence Sync] Found ${classOccurrences.length} occurrences for class ${classListingId}`)

  // 4. Get parent's existing occurrences to check for duplicates
  const { data: parentOccurrences, error: parentOccurrencesError } = await supabase
    .from("listing_occurrences")
    .select("starts_at_utc, address, place_id, venue_name, location_instructions")
    .eq("listing_id", parentListingId)

  if (parentOccurrencesError) {
    console.error(`[Class Occurrence Sync] Failed to fetch parent occurrences: ${parentOccurrencesError.message}`)
    return
  }

  console.log(`[Class Occurrence Sync] Parent ${parentListingId} has ${parentOccurrences?.length || 0} existing occurrences`)

  // 5. Filter occurrences to add (check for duplicates)
  const occurrencesToAdd = classOccurrences.filter((classOcc) => {
    // Check if this occurrence already exists on parent
    const isDuplicate = parentOccurrences?.some((parentOcc) => {
      // Match by starts_at_utc and location fields
      const timeMatch = parentOcc.starts_at_utc === classOcc.starts_at_utc
      const addressMatch = (parentOcc.address || null) === (classOcc.address || null)
      const placeIdMatch = (parentOcc.place_id || null) === (classOcc.place_id || null)
      const venueMatch = (parentOcc.venue_name || null) === (classOcc.venue_name || null)
      const instructionsMatch = (parentOcc.location_instructions || null) === (classOcc.location_instructions || null)

      return timeMatch && addressMatch && placeIdMatch && venueMatch && instructionsMatch
    })

    if (isDuplicate) {
      console.log(`[Class Occurrence Sync] Duplicate occurrence found: ${classOcc.starts_at_utc} at ${classOcc.venue_name || classOcc.address || 'unknown location'}`)
    }

    return !isDuplicate
  })

  if (occurrencesToAdd.length === 0) {
    console.log(`[Class Occurrence Sync] No occurrences to add (all ${classOccurrences.length} occurrences already exist on parent)`)
    return
  }

  console.log(`[Class Occurrence Sync] Adding ${occurrencesToAdd.length} occurrences to parent ${parentListingId} (${classOccurrences.length - occurrencesToAdd.length} already exist on parent)`)

  // 6. Insert occurrences into parent with source tracking
  const occurrencesWithSource = occurrencesToAdd.map((occ) => ({
    listing_id: parentListingId,
    occurrence_type: occ.occurrence_type,
    starts_at_utc: occ.starts_at_utc,
    ends_at_utc: occ.ends_at_utc,
    tz: occ.tz,
    address: occ.address,
    place_id: occ.place_id,
    lat: occ.lat,
    lng: occ.lng,
    venue_name: occ.venue_name,
    location_instructions: occ.location_instructions,
    source_class_listing_id: classListingId,
  }))

  console.log(`[Class Occurrence Sync] Inserting ${occurrencesWithSource.length} occurrences:`, occurrencesWithSource.map(occ => ({
    starts_at_utc: occ.starts_at_utc,
    venue: occ.venue_name || occ.address || 'unknown',
    source_class: occ.source_class_listing_id
  })))

  const { error: insertError } = await supabase
    .from("listing_occurrences")
    .insert(occurrencesWithSource)

  if (insertError) {
    console.error(`[Class Occurrence Sync] Failed to add class occurrences to parent: ${insertError.message}`, insertError)
    // Don't throw - approval should still succeed even if this fails
  } else {
    console.log(`[Class Occurrence Sync] Successfully added ${occurrencesWithSource.length} occurrences to parent ${parentListingId}`)
  }
}

/**
 * Removes occurrences from parent workshop that were added by a class
 * Called when a class is rejected
 */
async function removeClassOccurrencesFromParent(
  supabase: SupabaseClient,
  classListingId: string
): Promise<void> {
  console.log(`[Class Occurrence Sync] Removing occurrences added by class ${classListingId}`)
  
  // First, check how many occurrences will be removed
  const { data: occurrencesToRemove, error: countError } = await supabase
    .from("listing_occurrences")
    .select("id, listing_id, starts_at_utc, venue_name, address")
    .eq("source_class_listing_id", classListingId)

  if (countError) {
    console.error(`[Class Occurrence Sync] Failed to count occurrences to remove: ${countError.message}`)
    return
  }

  if (!occurrencesToRemove || occurrencesToRemove.length === 0) {
    console.log(`[Class Occurrence Sync] No occurrences found to remove for class ${classListingId}`)
    return
  }

  console.log(`[Class Occurrence Sync] Found ${occurrencesToRemove.length} occurrences to remove:`, 
    occurrencesToRemove.map(occ => ({
      id: occ.id,
      parent_listing_id: occ.listing_id,
      starts_at_utc: occ.starts_at_utc,
      venue: occ.venue_name || occ.address || 'unknown'
    }))
  )

  // Find and delete all occurrences on parent workshops that were added by this class
  const { error: deleteError } = await supabase
    .from("listing_occurrences")
    .delete()
    .eq("source_class_listing_id", classListingId)

  if (deleteError) {
    console.error(`[Class Occurrence Sync] Failed to remove class occurrences from parent: ${deleteError.message}`)
    // Don't throw - rejection should still succeed even if this fails
  } else {
    console.log(`[Class Occurrence Sync] Successfully removed ${occurrencesToRemove.length} occurrences from parent workshops`)
  }
}

/**
 * Removes occurrences from parent event that were added by a piece
 * Called when a piece is rejected
 */
async function removePieceOccurrencesFromParent(
  supabase: SupabaseClient,
  pieceListingId: string
): Promise<void> {
  console.log(`[Piece Occurrence Sync] Removing occurrences added by piece ${pieceListingId}`)
  
  // First, check how many occurrences will be removed
  const { data: occurrencesToRemove, error: countError } = await supabase
    .from("listing_occurrences")
    .select("id, listing_id, starts_at_utc, venue_name, address")
    .eq("source_piece_listing_id", pieceListingId)

  if (countError) {
    console.error(`[Piece Occurrence Sync] Failed to count occurrences to remove: ${countError.message}`)
    return
  }

  if (!occurrencesToRemove || occurrencesToRemove.length === 0) {
    console.log(`[Piece Occurrence Sync] No occurrences found to remove for piece ${pieceListingId}`)
    return
  }

  console.log(`[Piece Occurrence Sync] Found ${occurrencesToRemove.length} occurrences to remove:`, 
    occurrencesToRemove.map(occ => ({
      id: occ.id,
      parent_listing_id: occ.listing_id,
      starts_at_utc: occ.starts_at_utc,
      venue: occ.venue_name || occ.address || 'unknown'
    }))
  )

  // Find and delete all occurrences on parent events that were added by this piece
  const { error: deleteError } = await supabase
    .from("listing_occurrences")
    .delete()
    .eq("source_piece_listing_id", pieceListingId)

  if (deleteError) {
    console.error(`[Piece Occurrence Sync] Failed to remove piece occurrences from parent: ${deleteError.message}`)
    // Don't throw - rejection should still succeed even if this fails
  } else {
    console.log(`[Piece Occurrence Sync] Successfully removed ${occurrencesToRemove.length} occurrences from parent events`)
  }
}

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

  // 3) If this is a piece or class, add its custom occurrences to parent event/workshop
  console.log(`[Approval] Processing approval for listing ${listingId}`)
  try {
    // Check listing type to determine which occurrence sync to call
    const { data: listing } = await supabase
      .from("listings")
      .select("type")
      .eq("id", listingId)
      .single()
    
    if (listing?.type === "performance") {
      await addPieceOccurrencesToParent(supabase, listingId)
    } else if (listing?.type === "class") {
      await addClassOccurrencesToParent(supabase, listingId)
    }
  } catch (error) {
    console.error(`[Approval] Failed to add occurrences to parent for listing ${listingId}:`, error)
    // Don't fail approval if this fails
  }
  console.log(`[Approval] Completed approval processing for listing ${listingId}`)

  // 4) Send email notification
  try {
    const { data: listingData } = await supabase
      .from("listings")
      .select(`
        id, type, contact_name, contact_email,
        performance_details (*),
        audition_details (*),
        creative_details (*),
        class_workshop_details!class_workshop_details_listing_id_fkey (*),
        piece_details!piece_details_listing_id_fkey (*)
      `)
      .eq("id", listingId)
      .single()

    if (listingData?.contact_email && listingData?.contact_name) {
      const listingForTitle = listingData as unknown as PublicListingDetail
      const listingTitle = getListingTitle(listingForTitle)
      await sendListingUpdateEmail(
        listingId,
        listingData.contact_email,
        listingData.contact_name,
        listingTitle
      )
    }
  } catch (emailError) {
    // Don't fail approval if email fails
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

  // Remove occurrences from parent event/workshop that were added by this piece/class
  console.log(`[Rejection] Processing rejection for listing ${listingId}`)
  try {
    // Check listing type to determine which occurrence sync to call
    const { data: listing } = await supabase
      .from("listings")
      .select("type")
      .eq("id", listingId)
      .single()
    
    if (listing?.type === "performance") {
      await removePieceOccurrencesFromParent(supabase, listingId)
    } else if (listing?.type === "class") {
      await removeClassOccurrencesFromParent(supabase, listingId)
    }
  } catch (error) {
    console.error(`[Rejection] Failed to remove occurrences from parent for listing ${listingId}:`, error)
    // Don't fail rejection if this fails
  }
  console.log(`[Rejection] Completed rejection processing for listing ${listingId}`)

  // Send email notification
  try {
    const { data: listingData } = await supabase
      .from("listings")
      .select(`
        id, type, contact_name, contact_email,
        performance_details (*),
        audition_details (*),
        creative_details (*),
        class_workshop_details!class_workshop_details_listing_id_fkey (*),
        piece_details!piece_details_listing_id_fkey (*)
      `)
      .eq("id", listingId)
      .single()

    if (listingData?.contact_email && listingData?.contact_name) {
      const listingForTitle = listingData as unknown as PublicListingDetail
      const listingTitle = getListingTitle(listingForTitle)
      await sendListingUpdateEmail(
        listingId,
        listingData.contact_email,
        listingData.contact_name,
        listingTitle
      )
    }
  } catch (emailError) {
    // Don't fail rejection if email fails
  }
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

export async function listAdminListingsRepo(params: {
  status: ListingStatus
  limit: number
}) {
  const svc = getSupabaseServiceClient()
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
    .eq("status", params.status)
    .is("deleted_at", null)
    .order("submitted_at", { ascending: false })
    .limit(params.limit)
  if (error) throw error

  // Fetch parent listing titles for pieces and classes that have parent_listing_id
  const pieceParentIds = (data ?? [])
    .filter((e: any) => {
      if (e.type !== "performance" || e.performance_details?.subtype !== "PIECE") return false
      const pieceDetails = Array.isArray(e.piece_details) ? e.piece_details[0] : e.piece_details
      return pieceDetails?.parent_listing_id
    })
    .map((e: any) => {
      const pieceDetails = Array.isArray(e.piece_details) ? e.piece_details[0] : e.piece_details
      return pieceDetails?.parent_listing_id
    })
    .filter((id): id is string => !!id)
  
  const classParentIds = (data ?? [])
    .filter((e: any) => {
      if (e.type !== "class") return false
      const classDetails = Array.isArray(e.class_workshop_details) ? e.class_workshop_details[0] : e.class_workshop_details
      return classDetails?.parent_listing_id && classDetails?.class_workshop_type === "CLASS"
    })
    .map((e: any) => {
      const classDetails = Array.isArray(e.class_workshop_details) ? e.class_workshop_details[0] : e.class_workshop_details
      return classDetails?.parent_listing_id
    })
    .filter((id): id is string => !!id)
  
  let parentTitles: Record<string, string> = {}
  const allParentIds = [...new Set([...pieceParentIds, ...classParentIds])]
  
  if (allParentIds.length > 0) {
    const { data: parentData } = await svc
      .from("listings")
      .select(`
        id,
        type,
        performance_details (title),
        class_workshop_details!class_workshop_details_listing_id_fkey (title)
      `)
      .in("id", allParentIds)
    
    if (parentData) {
      parentTitles = Object.fromEntries(
        parentData.map((p: any) => {
          if (p.type === "performance") {
            const perfDetails = Array.isArray(p.performance_details) ? p.performance_details[0] : p.performance_details
            return [p.id, perfDetails?.title || ""]
          } else if (p.type === "class") {
            const classDetails = Array.isArray(p.class_workshop_details) ? p.class_workshop_details[0] : p.class_workshop_details
            return [p.id, classDetails?.title || ""]
          }
          return [p.id, ""]
        })
      )
    }
  }

  return (data ?? []).map((e: any) => {
    let title: string | null = null
    
    if (e.type === "performance") {
      const perfDetails = Array.isArray(e.performance_details) ? e.performance_details[0] : e.performance_details
      if (perfDetails?.subtype === "PIECE") {
        // For pieces: construct title from festival/parent event + piece info
        const pieceDetails = Array.isArray(e.piece_details) ? e.piece_details[0] : e.piece_details
        const parentEventName = pieceDetails?.parent_event_name
        const parentListingTitle = pieceDetails?.parent_listing_id 
          ? parentTitles[pieceDetails.parent_listing_id] 
          : null
        const festivalName = parentListingTitle || parentEventName
        
        // Get piece title from piece_details table
        const pieceTitle = pieceDetails?.piece_title || pieceDetails?.piece_company || null
        
        if (festivalName && pieceTitle) {
          title = `${festivalName} - ${pieceTitle}`
        } else if (festivalName) {
          title = festivalName
        } else if (pieceTitle) {
          title = pieceTitle
        } else {
          title = "Untitled Piece"
        }
      } else {
        // ORGANIZER
        title = perfDetails?.title ?? null
      }
    } else if (e.type === "audition") {
      const auditionDetails = Array.isArray(e.audition_details) ? e.audition_details[0] : e.audition_details
      title = auditionDetails?.title ?? null
    } else if (e.type === "creative") {
      const creativeDetails = Array.isArray(e.creative_details) ? e.creative_details[0] : e.creative_details
      title = creativeDetails?.title ?? null
    } else if (e.type === "class") {
      const classDetails = Array.isArray(e.class_workshop_details) ? e.class_workshop_details[0] : e.class_workshop_details
      if (classDetails?.class_workshop_type === "CLASS") {
        // For classes: construct title from workshop/parent + class info
        const parentWorkshopName = classDetails?.parent_workshop_name
        const parentListingTitle = classDetails?.parent_listing_id 
          ? parentTitles[classDetails.parent_listing_id] 
          : null
        const workshopName = parentListingTitle || parentWorkshopName
        
        const className = classDetails?.title || null
        
        if (workshopName && className) {
          title = `${workshopName} - ${className}`
        } else if (workshopName) {
          title = workshopName
        } else if (className) {
          title = className
        } else {
          title = "Untitled Class"
        }
      } else {
        // WORKSHOP
        title = classDetails?.title ?? null
      }
    } else {
      title = "Untitled"
    }
    
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

  // If this is a piece with a parent listing, fetch the parent's title
  const perfDetails = Array.isArray(data.performance_details) ? data.performance_details[0] : data.performance_details
  const pieceDetails = Array.isArray(data.piece_details) ? data.piece_details[0] : data.piece_details
  
  if (data.type === "performance" && perfDetails?.subtype === "PIECE" && pieceDetails?.parent_listing_id) {
    const { data: parentData } = await svc
      .from("listings")
      .select(`
        id,
        performance_details (title)
      `)
      .eq("id", pieceDetails.parent_listing_id)
      .single()
    
    if (parentData) {
      const parentPerfDetails = Array.isArray(parentData.performance_details) ? parentData.performance_details[0] : parentData.performance_details
      if (parentPerfDetails?.title) {
        // Add parent title to piece_details for easy access
        if (Array.isArray(data.piece_details)) {
          if (data.piece_details[0]) {
            (data.piece_details[0] as any).parent_listing_title = parentPerfDetails.title
          }
        } else if (data.piece_details) {
          (data.piece_details as any).parent_listing_title = parentPerfDetails.title
        }
      }
    }
  }

  // If this is a class with a parent listing, fetch the parent's title
  const classDetails = Array.isArray(data.class_workshop_details) ? data.class_workshop_details[0] : data.class_workshop_details
  
  if (data.type === "class" && classDetails?.class_workshop_type === "CLASS" && classDetails?.parent_listing_id) {
    const { data: parentData } = await svc
      .from("listings")
      .select(`
        id,
        class_workshop_details!class_workshop_details_listing_id_fkey (title)
      `)
      .eq("id", classDetails.parent_listing_id)
      .single()
    
    if (parentData) {
      const parentClassDetails = Array.isArray(parentData.class_workshop_details) ? parentData.class_workshop_details[0] : parentData.class_workshop_details
      if (parentClassDetails?.title) {
        // Add parent title to class_workshop_details for easy access
        if (Array.isArray(data.class_workshop_details)) {
          if (data.class_workshop_details[0]) {
            (data.class_workshop_details[0] as any).parent_listing_title = parentClassDetails.title
          }
        } else if (data.class_workshop_details) {
          (data.class_workshop_details as any).parent_listing_title = parentClassDetails.title
        }
      }
    }
  }

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

export async function searchParentEventsRepo(params: {
  query: string
  limit?: number
}) {
  const svc = getSupabaseServiceClient()
  const limit = params.limit ?? 20
  const queryLower = params.query.toLowerCase().trim()
  
  const { data, error } = await svc
    .from("listings")
    .select(`
      id,
      performance_details!inner (title, subtype)
    `)
    .eq("performance_details.subtype", "ORGANIZER")
    .is("deleted_at", null)
  
  if (error) throw error
  
  const filtered = (data ?? [])
    .map((item: any) => {
      const perfDetails = Array.isArray(item.performance_details) 
        ? item.performance_details[0] 
        : item.performance_details
      return {
        id: item.id,
        title: perfDetails?.title || "Untitled",
        perfDetails,
      }
    })
    .filter((item) => {
      return item.title.toLowerCase().includes(queryLower)
    })
    .sort((a, b) => a.title.localeCompare(b.title))
    .slice(0, limit)
  
  return filtered.map((item) => ({
    id: item.id,
    title: item.title,
  }))
}

export async function updatePieceParentLinkRepo(params: {
  pieceListingId: string
  parentListingId: string
}) {
  const svc = getSupabaseServiceClient()
  
  const { error } = await svc
    .from("piece_details")
    .update({
      parent_listing_id: params.parentListingId,
      parent_event_name: null,
      parent_event_website: null,
      parent_event_contact_email: null,
      updated_at: new Date().toISOString(),
    })
    .eq("listing_id", params.pieceListingId)
  
  if (error) throw new Error(`Failed to update piece parent link: ${error.message}`)
  
  const { error: relError } = await svc.rpc("link_listings", {
    p_parent_listing_id: params.parentListingId,
    p_child_listing_id: params.pieceListingId,
    p_relationship_type: "performance_piece",
  })
  
  if (relError) {
    console.warn(`Failed to create listing relationship: ${relError.message}`)
  }
  
  await addPieceOccurrencesToParent(svc, params.pieceListingId)
}

export async function createMinimalParentEventRepo(params: {
  name: string
  website?: string | null
  email?: string | null
  pieceIds: string[]
}) {
  const svc = getSupabaseServiceClient()
  
  const { data: { user } } = await svc.auth.getUser()
  if (!user?.id) {
    throw new Error("Unauthorized")
  }
  
  let listingId: string | null = null
  
  try {
    const { data: listing, error: listingError } = await svc
      .from("listings")
      .insert({
        type: "performance",
        status: "pending",
        created_by: user.id,
        contact_name: "Admin Created",
        contact_email: params.email || "admin@example.com",
        company: null,
        company_website: params.website || null,
        meta: { admin_created: true, minimal_parent: true },
      })
      .select("id")
      .single()
    
    if (listingError) {
      throw new Error(`Failed to create listing: ${listingError.message}`)
    }
    
    listingId = listing.id as string
    
    const { error: perfError } = await svc
      .from("performance_details")
      .insert({
        listing_id: listingId,
        subtype: "ORGANIZER",
        title: params.name,
        website: params.website || null,
      })
    
    if (perfError) {
      throw new Error(`Failed to create performance details: ${perfError.message}`)
    }
    
    for (const pieceId of params.pieceIds) {
      const { error: pieceError } = await svc
        .from("piece_details")
        .update({
          parent_listing_id: listingId,
          parent_event_name: null,
          parent_event_website: null,
          parent_event_contact_email: null,
          updated_at: new Date().toISOString(),
        })
        .eq("listing_id", pieceId)
      
      if (pieceError) {
        console.warn(`Failed to link piece ${pieceId}: ${pieceError.message}`)
        continue
      }
      
      const { error: relError } = await svc.rpc("link_listings", {
        p_parent_listing_id: listingId,
        p_child_listing_id: pieceId,
        p_relationship_type: "performance_piece",
      })
      
      if (relError) {
        console.warn(`Failed to create relationship for piece ${pieceId}: ${relError.message}`)
      }
    }
    
    return { listingId }
  } catch (error) {
    if (listingId) {
      await svc.from("listings").delete().eq("id", listingId)
    }
    throw error
  }
}

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
      performance_details!inner (subtype),
      piece_details!piece_details_listing_id_fkey (
        parent_event_name,
        parent_event_website,
        parent_event_contact_email,
        parent_listing_id,
        piece_title,
        piece_company,
        piece_company_website,
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
      const pieceDetails = Array.isArray(item.piece_details) 
        ? item.piece_details[0] 
        : item.piece_details
      return pieceDetails && pieceDetails.parent_event_name && !pieceDetails.parent_listing_id
    })
    .map((item: any) => {
      const pieceDetails = Array.isArray(item.piece_details) 
        ? item.piece_details[0] 
        : item.piece_details
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
        choreographer: pieceDetails?.choreographer || null,
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
        parent_event_name: pieceDetails?.parent_event_name || null,
        parent_event_website: pieceDetails?.parent_event_website || null,
        parent_event_contact_email: pieceDetails?.parent_event_contact_email || null,
      }
    })
}

export async function searchParentWorkshopsRepo(params: {
  query: string
  limit?: number
}) {
  const svc = getSupabaseServiceClient()
  const limit = params.limit ?? 20
  const queryLower = params.query.toLowerCase().trim()
  
  const { data, error } = await svc
    .from("listings")
    .select(`
      id,
      class_workshop_details!class_workshop_details_listing_id_fkey!inner (title, class_workshop_type)
    `)
    .eq("class_workshop_details.class_workshop_type", "WORKSHOP")
    .is("deleted_at", null)
  
  if (error) throw error
  
  const filtered = (data ?? [])
    .map((item: any) => {
      const classDetails = Array.isArray(item.class_workshop_details) 
        ? item.class_workshop_details[0] 
        : item.class_workshop_details
      return {
        id: item.id,
        title: classDetails?.title || "Untitled",
        classDetails,
      }
    })
    .filter((item) => {
      return item.title.toLowerCase().includes(queryLower)
    })
    .sort((a, b) => a.title.localeCompare(b.title))
    .slice(0, limit)
  
  return filtered.map((item) => ({
    id: item.id,
    title: item.title,
  }))
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
      const classDetails = Array.isArray(item.class_workshop_details) 
        ? item.class_workshop_details[0] 
        : item.class_workshop_details
      return classDetails && classDetails.parent_workshop_name && !classDetails.parent_listing_id
    })
    .map((item: any) => {
      const classDetails = Array.isArray(item.class_workshop_details) 
        ? item.class_workshop_details[0] 
        : item.class_workshop_details
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

export async function updateClassParentLinkRepo(params: {
  classListingId: string
  parentListingId: string
}) {
  const svc = getSupabaseServiceClient()
  
  const { error } = await svc
    .from("class_workshop_details")
    .update({
      parent_listing_id: params.parentListingId,
      parent_workshop_name: null,
      parent_workshop_website: null,
      parent_workshop_contact_email: null,
      updated_at: new Date().toISOString(),
    })
    .eq("listing_id", params.classListingId)
  
  if (error) throw new Error(`Failed to update class parent link: ${error.message}`)
  
  const { error: relError } = await svc.rpc("link_listings", {
    p_parent_listing_id: params.parentListingId,
    p_child_listing_id: params.classListingId,
    p_relationship_type: "workshop_class",
  })
  
  if (relError) {
    console.warn(`Failed to create listing relationship: ${relError.message}`)
  }
  
  await addClassOccurrencesToParent(svc, params.classListingId)
}

export async function createMinimalParentWorkshopRepo(params: {
  name: string
  website?: string | null
  email?: string | null
  classIds: string[]
}) {
  const svc = getSupabaseServiceClient()
  
  const { data: { user } } = await svc.auth.getUser()
  if (!user?.id) {
    throw new Error("Unauthorized")
  }
  
  let listingId: string | null = null
  
  try {
    const { data: listing, error: listingError } = await svc
      .from("listings")
      .insert({
        type: "class",
        status: "pending",
        created_by: user.id,
        contact_name: "Admin Created",
        contact_email: params.email || "admin@example.com",
        company: null,
        company_website: params.website || null,
        meta: { admin_created: true, minimal_parent: true },
      })
      .select("id")
      .single()
    
    if (listingError) {
      throw new Error(`Failed to create listing: ${listingError.message}`)
    }
    
    listingId = listing.id as string
    
    const { error: classError } = await svc
      .from("class_workshop_details")
      .insert({
        listing_id: listingId,
        class_workshop_type: "WORKSHOP",
        title: params.name,
        description: "Workshop created by admin",
        organizer: "Admin",
        teachers: "",
        website: params.website || null,
      })
    
    if (classError) {
      throw new Error(`Failed to create class workshop details: ${classError.message}`)
    }
    
    for (const classId of params.classIds) {
      const { error: classUpdateError } = await svc
        .from("class_workshop_details")
        .update({
          parent_listing_id: listingId,
          parent_workshop_name: null,
          parent_workshop_website: null,
          parent_workshop_contact_email: null,
          updated_at: new Date().toISOString(),
        })
        .eq("listing_id", classId)
      
      if (classUpdateError) {
        console.warn(`Failed to link class ${classId}: ${classUpdateError.message}`)
        continue
      }
      
      const { error: relError } = await svc.rpc("link_listings", {
        p_parent_listing_id: listingId,
        p_child_listing_id: classId,
        p_relationship_type: "workshop_class",
      })
      
      if (relError) {
        console.warn(`Failed to create relationship for class ${classId}: ${relError.message}`)
      }
    }
    
    return { listingId }
  } catch (error) {
    if (listingId) {
      await svc.from("listings").delete().eq("id", listingId)
    }
    throw error
  }
}
