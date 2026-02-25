import type { SupabaseClient } from "@supabase/supabase-js"

export type RelationshipType = "performance_piece" | "workshop_class"

export interface EnsureRelationshipParams {
  parentListingId: string
  childListingId: string
  relationshipType: RelationshipType
  createdBy: string | null
  supabase: SupabaseClient
}

/**
 * Ensures a listing relationship exists, creating it if necessary.
 * Relies on database constraints for uniqueness - no manual verification needed.
 */
export async function ensureListingRelationship(
  params: EnsureRelationshipParams
): Promise<void> {
  const { parentListingId, childListingId, relationshipType, createdBy, supabase } = params

  if (!createdBy) {
    throw new Error("User ID required to create relationship")
  }

  const { error } = await supabase.rpc("add_listing_child", {
    p_parent_listing_id: parentListingId,
    p_child_listing_id: childListingId,
    p_relationship_type: relationshipType,
    p_created_by: createdBy,
  })

  if (error) {
    const errorCode = (error as any).code
    if (errorCode === "23505" || errorCode === "PGRST116") {
      return
    }
    throw new Error(`Failed to create listing relationship: ${error.message}`)
  }
}

/**
 * Validates that parent listing exists and is not deleted
 */
export async function validateParentExists(
  parentListingId: string,
  supabase: SupabaseClient
): Promise<void> {
  const { data, error } = await supabase
    .from("listings")
    .select("id")
    .eq("id", parentListingId)
    .is("deleted_at", null)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to validate parent listing: ${error.message}`)
  }

  if (!data) {
    throw new Error(`Parent listing not found or deleted: ${parentListingId}`)
  }
}
