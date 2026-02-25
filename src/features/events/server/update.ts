import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { BaseListingInput, ListingType } from "./repository-types"
import { detailTable } from "./repository-types"

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
