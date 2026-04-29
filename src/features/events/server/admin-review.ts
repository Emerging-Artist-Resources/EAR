import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
import { storageService } from "@/services/storage"
import { sendListingUpdateEmail, sendListingShareEmailsAfterApproval } from "./service"
import { getListingTitle } from "./listing-utils"
import { normalizeSupabaseRelation } from "./admin-utils"
import type { PublicListingDetail } from "@/components/calendar/PublicListingDetailSections"
import {
  addPieceOccurrencesToParent,
  addClassOccurrencesToParent,
  removePieceOccurrencesFromParent,
  removeClassOccurrencesFromParent,
} from "./admin-occurrence-sync"

/**
 * Migrates photos from private to public bucket for approved listings
 */
async function migratePhotosToPublic(listingId: string): Promise<void> {
  const supabase = await getSupabaseServerClient()
  const svc = getSupabaseServiceClient()
  
  const { data: photos, error: photosError } = await supabase
    .from("listing_photos")
    .select("id, path")
    .eq("listing_id", listingId)

  if (photosError) {
    console.error(`Failed to fetch photos for listing ${listingId}:`, photosError)
    return
  }

  if (!photos || photos.length === 0) {
    return
  }

  const privateBucket = "event-photos"
  const publicBucket = "event-photos-public"
  
  for (const photo of photos) {
    try {
      await storageService.moveFile(svc, privateBucket, publicBucket, photo.path)
    } catch (moveError) {
      console.error(`Failed to move photo ${photo.id} (${photo.path}):`, moveError)
    }
  }
}

/**
 * Sends approval email notification
 */
async function sendApprovalEmail(listingId: string): Promise<void> {
  const supabase = await getSupabaseServerClient()
  
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
    console.error(`Failed to send approval email for listing ${listingId}:`, emailError)
  }
}

/**
 * Sends rejection email notification
 */
async function sendRejectionEmail(listingId: string): Promise<void> {
  const supabase = await getSupabaseServerClient()
  
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
    console.error(`Failed to send rejection email for listing ${listingId}:`, emailError)
  }
}

export async function approveListingRepo(listingId: string, reviewerId: string) {
  const supabase = await getSupabaseServerClient()
  
  const { error } = await supabase
    .from("listings")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    })
    .eq("id", listingId)
  if (error) throw new Error(`Failed to approve listing: ${error.message}`)

  await migratePhotosToPublic(listingId)

  console.log(`[Approval] Processing approval for listing ${listingId}`)
  try {
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
  }
  console.log(`[Approval] Completed approval processing for listing ${listingId}`)

  await sendApprovalEmail(listingId)
  try {
    await sendListingShareEmailsAfterApproval(listingId)
  } catch (shareEmailError) {
    console.error(`Failed to send share listing emails for ${listingId}:`, shareEmailError)
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

  console.log(`[Rejection] Processing rejection for listing ${listingId}`)
  try {
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
  }
  console.log(`[Rejection] Completed rejection processing for listing ${listingId}`)

  await sendRejectionEmail(listingId)
}

export async function deleteListingRepo(listingId: string) {
  const svc = getSupabaseServiceClient()
  
  // Check if this is a piece or class before deleting
  const { data: listing } = await svc
    .from("listings")
    .select("type, performance_details (subtype), class_workshop_details (class_workshop_type)")
    .eq("id", listingId)
    .maybeSingle()
  
  const perfDetails = normalizeSupabaseRelation(listing?.performance_details)
  const classDetails = normalizeSupabaseRelation(listing?.class_workshop_details)
  
  const isPiece = listing?.type === "performance" && perfDetails?.subtype === "PIECE"
  const isClass = listing?.type === "class" && classDetails?.class_workshop_type === "CLASS"
  
  const { error } = await svc
    .from("listings")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
  
  if (error) throw new Error(`Failed to delete listing: ${error.message}`)
  
  // Remove occurrences if this was a piece
  if (isPiece) {
    try {
      await removePieceOccurrencesFromParent(svc, listingId)
    } catch (error) {
      console.error(`[Delete] Failed to remove occurrences from parent for piece ${listingId}:`, error)
    }
  }
  
  // Remove occurrences if this was a class
  if (isClass) {
    try {
      await removeClassOccurrencesFromParent(svc, listingId)
    } catch (error) {
      console.error(`[Delete] Failed to remove occurrences from parent for class ${listingId}:`, error)
    }
  }
}
