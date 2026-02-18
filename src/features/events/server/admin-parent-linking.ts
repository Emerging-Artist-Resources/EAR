import { getSupabaseServiceClient } from "@/lib/supabase/service"
import {
  ensureListingRelationship,
  validateParentExists,
} from "./admin-relationship-helpers"
import {
  addPieceOccurrencesToParent,
  addClassOccurrencesToParent,
} from "./admin-occurrence-sync"

export async function updatePieceParentLinkRepo(params: {
  pieceListingId: string
  parentListingId: string
  createdBy?: string | null
}) {
  const svc = getSupabaseServiceClient()
  
  await validateParentExists(params.parentListingId, svc)
  
  // Use provided createdBy, or try to get from service client (for backward compatibility)
  let createdBy = params.createdBy
  if (!createdBy) {
    const { data: { user } } = await svc.auth.getUser()
    createdBy = user?.id || null
  }
  
  if (!createdBy) {
    throw new Error("User ID required to create listing relationship")
  }
  
  // Check if piece is already approved before linking
  // If approved, we'll need to add occurrences after linking
  const { data: listing } = await svc
    .from("listings")
    .select("status")
    .eq("id", params.pieceListingId)
    .single()
  
  const isAlreadyApproved = listing?.status === "approved"
  
  // Create relationship FIRST - if this fails, piece_details remains unchanged
  // and the piece will still appear in the "Link Pieces" page for retry
  await ensureListingRelationship({
    parentListingId: params.parentListingId,
    childListingId: params.pieceListingId,
    relationshipType: "performance_piece",
    createdBy,
    supabase: svc,
  })
  
  // Only update piece_details AFTER relationship is successfully created
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
  
  if (error) {
    throw new Error(`Failed to update piece parent link: ${error.message}`)
  }
  
  // If piece is already approved, add occurrences to parent now
  // This handles the "approve first, then link" flow.
  // For "link first, then approve" flow, occurrences are added during approval.
  if (isAlreadyApproved) {
    try {
      await addPieceOccurrencesToParent(svc, params.pieceListingId)
    } catch (error) {
      console.error(
        `[Link] Failed to add occurrences to parent for already-approved piece ${params.pieceListingId}:`,
        error
      )
      // Don't throw - linking succeeded, occurrence sync failure shouldn't block it
    }
  }
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
        throw new Error(`Failed to link piece ${pieceId}: ${pieceError.message}`)
      }
      
      await ensureListingRelationship({
        parentListingId: listingId,
        childListingId: pieceId,
        relationshipType: "performance_piece",
        createdBy: user.id,
        supabase: svc,
      })
    }
    
    return { listingId }
  } catch (error) {
    if (listingId) {
      await svc.from("listings").delete().eq("id", listingId)
    }
    throw error
  }
}


export async function updateClassParentLinkRepo(params: {
  classListingId: string
  parentListingId: string
  createdBy?: string | null
}) {
  const svc = getSupabaseServiceClient()
  
  await validateParentExists(params.parentListingId, svc)
  
  // Use provided createdBy, or try to get from service client (for backward compatibility)
  let createdBy = params.createdBy
  if (!createdBy) {
    const { data: { user } } = await svc.auth.getUser()
    createdBy = user?.id || null
  }
  
  if (!createdBy) {
    throw new Error("User ID required to create listing relationship")
  }
  
  // Check if class is already approved before linking
  // If approved, we'll need to add occurrences after linking
  const { data: listing } = await svc
    .from("listings")
    .select("status")
    .eq("id", params.classListingId)
    .single()
  
  const isAlreadyApproved = listing?.status === "approved"
  
  // Create relationship FIRST - if this fails, class_workshop_details remains unchanged
  // and the class will still appear in the "Link Classes" page for retry
  await ensureListingRelationship({
    parentListingId: params.parentListingId,
    childListingId: params.classListingId,
    relationshipType: "workshop_class",
    createdBy,
    supabase: svc,
  })
  
  // Only update class_workshop_details AFTER relationship is successfully created
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
  
  if (error) {
    throw new Error(`Failed to update class parent link: ${error.message}`)
  }
  
  // If class is already approved, add occurrences to parent now
  // This handles the "approve first, then link" flow.
  // For "link first, then approve" flow, occurrences are added during approval.
  if (isAlreadyApproved) {
    try {
      await addClassOccurrencesToParent(svc, params.classListingId)
    } catch (error) {
      console.error(
        `[Link] Failed to add occurrences to parent for already-approved class ${params.classListingId}:`,
        error
      )
      // Don't throw - linking succeeded, occurrence sync failure shouldn't block it
    }
  }
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
        throw new Error(`Failed to link class ${classId}: ${classUpdateError.message}`)
      }
      
      await ensureListingRelationship({
        parentListingId: listingId,
        childListingId: classId,
        relationshipType: "workshop_class",
        createdBy: user.id,
        supabase: svc,
      })
    }
    
    return { listingId }
  } catch (error) {
    if (listingId) {
      await svc.from("listings").delete().eq("id", listingId)
    }
    throw error
  }
}
