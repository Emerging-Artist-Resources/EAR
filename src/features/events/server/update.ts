import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { BaseListingInput, ListingType } from "./repository-types"
import { detailTable } from "./repository-types"
import { finalizeListingMetaAfterClientPatch } from "./listing-meta-share"

export async function updatePendingListingRepo(
  listingId: string,
  patch: {
    base?: Partial<BaseListingInput>
    details?: Record<string, unknown>
  }
) {
  const supabase = await getSupabaseServerClient()

  if (patch.base) {
    const { meta: clientMetaPatch, ...restBase } = patch.base
    const updatePayload: Record<string, unknown> = { ...restBase }

    if (clientMetaPatch !== undefined) {
      const { data: row, error: metaFetchErr } = await supabase
        .from("listings")
        .select("meta, contact_email")
        .eq("id", listingId)
        .single()
      if (metaFetchErr) {
        throw new Error(`Failed to get listing meta: ${metaFetchErr.message}`)
      }
      const contactEmail =
        typeof restBase.contact_email === "string" && restBase.contact_email
          ? restBase.contact_email
          : (row?.contact_email as string)
      const newMeta = finalizeListingMetaAfterClientPatch(
        (row?.meta as Record<string, unknown>) ?? {},
        clientMetaPatch as Record<string, unknown>,
        contactEmail
      )
      if (newMeta !== null) {
        updatePayload.meta = newMeta
      }
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error } = await supabase
        .from("listings")
        .update(updatePayload)
        .eq("id", listingId)
      if (error) throw new Error(`Failed to update listing base: ${error.message}`)
    }
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
