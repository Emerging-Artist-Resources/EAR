import type { SupabaseClient } from "@supabase/supabase-js"
import { convertUTCToEST } from "@/lib/datetime-utils"
import { isOccurrenceDuplicate } from "./admin-utils"
import {
  tryInsertWithSourceColumn,
  tryQueryWithSourceFilter,
} from "./admin-occurrence-helpers"

/**
 * Adds custom occurrences from a piece to its parent event
 */
export async function addPieceOccurrencesToParent(
  supabase: SupabaseClient,
  pieceListingId: string
): Promise<void> {
  const { data: pieceData, error: pieceError } = await supabase
    .from("piece_details")
    .select("parent_listing_id, piece_schedule_mode, selected_slots")
    .eq("listing_id", pieceListingId)
    .single()

  if (pieceError || !pieceData) {
    return
  }

  const selectedSlots = (pieceData.selected_slots as string[] | null) || []
  const parentListingId = pieceData.parent_listing_id
  if (!parentListingId) {
    return
  }

  const { data: parentData, error: parentError } = await supabase
    .from("performance_details")
    .select("subtype")
    .eq("listing_id", parentListingId)
    .single()

  if (parentError || !parentData || parentData.subtype !== "ORGANIZER") {
    return
  }

  const { data: pieceOccurrences, error: occurrencesError } = await tryQueryWithSourceFilter(
    supabase,
    pieceListingId,
    "source_piece_listing_id"
  )

  if (occurrencesError || !pieceOccurrences || pieceOccurrences.length === 0) {
    return
  }

  const { data: parentOccurrences, error: parentOccurrencesError } = await supabase
    .from("listing_occurrences")
    .select("starts_at_utc, address, place_id, venue_name, location_instructions")
    .eq("listing_id", parentListingId)

  if (parentOccurrencesError) {
    console.error(`[Piece Occurrence Sync] Failed to fetch parent occurrences: ${parentOccurrencesError.message}`)
    return
  }

  const selectedSlotKeys = new Set(selectedSlots)
  let occurrencesToAdd: typeof pieceOccurrences = []
  
  if (pieceData.piece_schedule_mode === "CUSTOM" || pieceData.piece_schedule_mode === null) {
    occurrencesToAdd = pieceOccurrences.filter((pieceOcc) => {
      return !parentOccurrences?.some((parentOcc) => 
        isOccurrenceDuplicate(pieceOcc, parentOcc)
      )
    })
  } else if (pieceData.piece_schedule_mode === "FROM_PARENT") {
    occurrencesToAdd = pieceOccurrences.filter((pieceOcc) => {
      const { date, time } = convertUTCToEST(pieceOcc.starts_at_utc)
      const slotKey = `${date}|${time}`
      
      if (selectedSlotKeys.has(slotKey)) {
        return false
      }
      
      return !parentOccurrences?.some((parentOcc) => 
        isOccurrenceDuplicate(pieceOcc, parentOcc)
      )
    })
  } else {
    return
  }

  if (occurrencesToAdd.length === 0) {
    return
  }

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

  try {
    await tryInsertWithSourceColumn(
      supabase,
      baseOccurrences,
      "source_piece_listing_id",
      pieceListingId
    )
  } catch (error) {
    console.error(`[Piece Occurrence Sync] Failed to add occurrences:`, error)
    throw error
  }
}

/**
 * Adds custom occurrences from a class to its parent workshop
 */
export async function addClassOccurrencesToParent(
  supabase: SupabaseClient,
  classListingId: string
): Promise<void> {
  console.log(`[Class Occurrence Sync] Starting addClassOccurrencesToParent for class ${classListingId}`)
  
  const { data: classData, error: classError } = await supabase
    .from("class_workshop_details")
    .select("parent_listing_id, class_workshop_type")
    .eq("listing_id", classListingId)
    .single()

  if (classError) {
    console.error(`[Class Occurrence Sync] Failed to fetch class data for ${classListingId}:`, classError.message)
    return
  }

  if (!classData) {
    console.log(`[Class Occurrence Sync] No class data found for ${classListingId}`)
    return
  }

  console.log(`[Class Occurrence Sync] Class data:`, {
    classListingId,
    class_workshop_type: classData.class_workshop_type,
    parent_listing_id: classData.parent_listing_id,
  })

  if (classData.class_workshop_type !== "CLASS") {
    console.log(`[Class Occurrence Sync] Skipping - not a CLASS type (got ${classData.class_workshop_type})`)
    return
  }

  const parentListingId = classData.parent_listing_id
  if (!parentListingId) {
    console.log(`[Class Occurrence Sync] Skipping - no parent_listing_id for class ${classListingId}`)
    return
  }

  console.log(`[Class Occurrence Sync] Validating parent workshop ${parentListingId}`)
  const { data: parentData, error: parentError } = await supabase
    .from("class_workshop_details")
    .select("class_workshop_type")
    .eq("listing_id", parentListingId)
    .single()

  if (parentError) {
    console.error(`[Class Occurrence Sync] Failed to fetch parent data for ${parentListingId}:`, parentError.message)
    return
  }

  if (!parentData || parentData.class_workshop_type !== "WORKSHOP") {
    console.log(`[Class Occurrence Sync] Skipping - parent ${parentListingId} is not a WORKSHOP (got ${parentData?.class_workshop_type || "null"})`)
    return
  }

  console.log(`[Class Occurrence Sync] Fetching occurrences for class ${classListingId}`)
  const { data: classOccurrences, error: occurrencesError } = await supabase
    .from("listing_occurrences")
    .select("*")
    .eq("listing_id", classListingId)
    .is("source_class_listing_id", null)

  if (occurrencesError) {
    console.error(`[Class Occurrence Sync] Failed to fetch class occurrences for ${classListingId}:`, occurrencesError.message)
    return
  }

  if (!classOccurrences || classOccurrences.length === 0) {
    console.log(`[Class Occurrence Sync] No occurrences found for class ${classListingId} (or all have source_class_listing_id set)`)
    return
  }

  console.log(`[Class Occurrence Sync] Found ${classOccurrences.length} occurrences for class ${classListingId}`)

  const { data: parentOccurrences, error: parentOccurrencesError } = await supabase
    .from("listing_occurrences")
    .select("starts_at_utc, address, place_id, venue_name, location_instructions")
    .eq("listing_id", parentListingId)

  if (parentOccurrencesError) {
    console.error(`[Class Occurrence Sync] Failed to fetch parent occurrences: ${parentOccurrencesError.message}`)
    return
  }

  console.log(`[Class Occurrence Sync] Found ${parentOccurrences?.length || 0} existing occurrences on parent ${parentListingId}`)

  const occurrencesToAdd = classOccurrences.filter((classOcc) => {
    return !parentOccurrences?.some((parentOcc) => 
      isOccurrenceDuplicate(classOcc, parentOcc)
    )
  })

  console.log(`[Class Occurrence Sync] Filtered to ${occurrencesToAdd.length} occurrences to add (${classOccurrences.length - occurrencesToAdd.length} duplicates skipped)`)

  if (occurrencesToAdd.length === 0) {
    console.log(`[Class Occurrence Sync] No new occurrences to add - all are duplicates`)
    return
  }

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

  console.log(`[Class Occurrence Sync] Inserting ${occurrencesWithSource.length} occurrences to parent ${parentListingId}`)
  const { error: insertError } = await supabase
    .from("listing_occurrences")
    .insert(occurrencesWithSource)

  if (insertError) {
    console.error(`[Class Occurrence Sync] Failed to add class occurrences to parent: ${insertError.message}`)
    throw insertError
  }

  console.log(`[Class Occurrence Sync] Successfully added ${occurrencesWithSource.length} occurrences to parent ${parentListingId}`)
}

/**
 * Removes occurrences from parent workshop that were added by a class
 * Only removes if no other approved classes or organizer also have the occurrence
 */
export async function removeClassOccurrencesFromParent(
  supabase: SupabaseClient,
  classListingId: string
): Promise<void> {
  const { data: occurrencesToCheck, error: countError } = await supabase
    .from("listing_occurrences")
    .select("id, listing_id, starts_at_utc, ends_at_utc, tz, address, place_id, venue_name, location_instructions")
    .eq("source_class_listing_id", classListingId)

  if (countError) {
    console.error(`[Class Occurrence Sync] Failed to find occurrences to remove: ${countError.message}`)
    return
  }

  if (!occurrencesToCheck || occurrencesToCheck.length === 0) {
    return
  }

  // Group occurrences by parent listing
  const occurrencesByParent = new Map<string, typeof occurrencesToCheck>()
  for (const occ of occurrencesToCheck) {
    if (!occurrencesByParent.has(occ.listing_id)) {
      occurrencesByParent.set(occ.listing_id, [])
    }
    occurrencesByParent.get(occ.listing_id)!.push(occ)
  }

  const occurrencesToRemove: string[] = []

  // Check each parent's occurrences
  for (const [parentListingId, occurrences] of occurrencesByParent) {
    // Get all occurrences on this parent to check for duplicates
    const { data: allParentOccurrences, error: parentOccError } = await supabase
      .from("listing_occurrences")
      .select("id, source_class_listing_id, starts_at_utc, ends_at_utc, tz, address, place_id, venue_name, location_instructions")
      .eq("listing_id", parentListingId)

    if (parentOccError) {
      console.error(`[Class Occurrence Sync] Failed to fetch parent occurrences for ${parentListingId}: ${parentOccError.message}`)
      continue
    }

    // Get all approved classes linked to this parent
    const { data: approvedClasses, error: classesError } = await supabase
      .from("class_workshop_details")
      .select("listing_id")
      .eq("parent_listing_id", parentListingId)
      .not("listing_id", "eq", classListingId) // Exclude the deleted class

    if (classesError) {
      console.error(`[Class Occurrence Sync] Failed to fetch approved classes for parent ${parentListingId}: ${classesError.message}`)
      continue
    }

    // Get status of those classes to filter for approved ones
    const approvedClassIds = new Set<string>()
    if (approvedClasses && approvedClasses.length > 0) {
      const classIds = approvedClasses.map(c => c.listing_id)
      const { data: classListings } = await supabase
        .from("listings")
        .select("id")
        .in("id", classIds)
        .eq("status", "approved")
        .is("deleted_at", null)
      
      if (classListings) {
        classListings.forEach(c => approvedClassIds.add(c.id))
      }
    }

    // Check each occurrence from deleted class
    for (const occToRemove of occurrences) {
      // Check if there's a duplicate occurrence from another source
      const hasDuplicateFromOtherSource = allParentOccurrences?.some((parentOcc) => {
        // Skip the occurrence we're checking
        if (parentOcc.id === occToRemove.id) return false
        
        // Check if it's a duplicate (same time/location)
        if (!isOccurrenceDuplicate(occToRemove, parentOcc)) return false
        
        if (parentOcc.source_class_listing_id === null) {
          return true
        }
        
        if (parentOcc.source_class_listing_id && approvedClassIds.has(parentOcc.source_class_listing_id)) {
          return true
        }
        
        return false
      })

      if (!hasDuplicateFromOtherSource) {
        occurrencesToRemove.push(occToRemove.id)
      }
    }
  }

  if (occurrencesToRemove.length === 0) {
    return
  }

  const { error: deleteError } = await supabase
    .from("listing_occurrences")
    .delete()
    .in("id", occurrencesToRemove)

  if (deleteError) {
    console.error(`[Class Occurrence Sync] Failed to remove class occurrences from parent: ${deleteError.message}`)
    throw deleteError
  }
}

/**
 * Removes occurrences from parent event that were added by a piece
 * Only removes if no other approved pieces or organizer also have the occurrence
 */
export async function removePieceOccurrencesFromParent(
  supabase: SupabaseClient,
  pieceListingId: string
): Promise<void> {
  const { data: occurrencesToCheck, error: countError } = await supabase
    .from("listing_occurrences")
    .select("id, listing_id, starts_at_utc, ends_at_utc, tz, address, place_id, venue_name, location_instructions")
    .eq("source_piece_listing_id", pieceListingId)

  if (countError) {
    console.error(`[Piece Occurrence Sync] Failed to find occurrences to remove: ${countError.message}`)
    return
  }

  if (!occurrencesToCheck || occurrencesToCheck.length === 0) {
    return
  }

  // Group occurrences by parent listing
  const occurrencesByParent = new Map<string, typeof occurrencesToCheck>()
  for (const occ of occurrencesToCheck) {
    if (!occurrencesByParent.has(occ.listing_id)) {
      occurrencesByParent.set(occ.listing_id, [])
    }
    occurrencesByParent.get(occ.listing_id)!.push(occ)
  }

  const occurrencesToRemove: string[] = []

  // Check each parent's occurrences
  for (const [parentListingId, occurrences] of occurrencesByParent) {
    // Get all occurrences on this parent to check for duplicates
    const { data: allParentOccurrences, error: parentOccError } = await supabase
      .from("listing_occurrences")
      .select("id, source_piece_listing_id, starts_at_utc, ends_at_utc, tz, address, place_id, venue_name, location_instructions")
      .eq("listing_id", parentListingId)

    if (parentOccError) {
      console.error(`[Piece Occurrence Sync] Failed to fetch parent occurrences for ${parentListingId}: ${parentOccError.message}`)
      continue
    }

    // Get all approved pieces linked to this parent
    const { data: approvedPieces, error: piecesError } = await supabase
      .from("piece_details")
      .select("listing_id")
      .eq("parent_listing_id", parentListingId)
      .not("listing_id", "eq", pieceListingId) // Exclude the deleted piece

    if (piecesError) {
      console.error(`[Piece Occurrence Sync] Failed to fetch approved pieces for parent ${parentListingId}: ${piecesError.message}`)
      continue
    }

    // Get status of those pieces to filter for approved ones
    const approvedPieceIds = new Set<string>()
    if (approvedPieces && approvedPieces.length > 0) {
      const pieceIds = approvedPieces.map(p => p.listing_id)
      const { data: pieceListings } = await supabase
        .from("listings")
        .select("id")
        .in("id", pieceIds)
        .eq("status", "approved")
        .is("deleted_at", null)
      
      if (pieceListings) {
        pieceListings.forEach(p => approvedPieceIds.add(p.id))
      }
    }

    // Check each occurrence from deleted piece
    for (const occToRemove of occurrences) {
      // Check if there's a duplicate occurrence from another source
      const hasDuplicateFromOtherSource = allParentOccurrences?.some((parentOcc) => {
        // Skip the occurrence we're checking
        if (parentOcc.id === occToRemove.id) return false
        
        // Check if it's a duplicate (same time/location)
        if (!isOccurrenceDuplicate(occToRemove, parentOcc)) return false
        
        if (parentOcc.source_piece_listing_id === null) {
          return true
        }
        
        if (parentOcc.source_piece_listing_id && approvedPieceIds.has(parentOcc.source_piece_listing_id)) {
          return true
        }
        
        return false
      })

      if (!hasDuplicateFromOtherSource) {
        occurrencesToRemove.push(occToRemove.id)
      }
    }
  }

  if (occurrencesToRemove.length === 0) {
    return
  }

  const { error: deleteError } = await supabase
    .from("listing_occurrences")
    .delete()
    .in("id", occurrencesToRemove)

  if (deleteError) {
    console.error(`[Piece Occurrence Sync] Failed to remove piece occurrences from parent: ${deleteError.message}`)
    throw deleteError
  }
}
