import type { SupabaseClient } from "@supabase/supabase-js"
import {
  enforceEstablishedPlatformListingFeeFields,
  nullEmergingPlatformListingFeeFields,
  validateClassParentConstraint,
} from "./create"
import { calculateListingFee } from "./fee-calculator"
import { buildPersistableListingMeta } from "./listing-meta-share"
import type { CreateListingInput, ListingType, OccurrenceType } from "./repository-types"
import { detailTable } from "./repository-types"

function scrubDetailRow(details: Record<string, unknown>): Record<string, unknown> {
  const d = { ...details }
  delete d.id
  delete d.listing_id
  delete d.created_at
  delete d.updated_at
  return d
}

export type ReplaceOwnedListingResult = {
  id: string
  payment_required: boolean
  /** Persisted status after fee recalculation (pending or pending_payment). */
  status: string
  /** True when save demoted an approved listing to pending (public calendar removal). */
  was_approved_resubmit: boolean
}

export async function replaceOwnedListingRepo(
  supabase: SupabaseClient,
  listingId: string,
  userId: string,
  input: CreateListingInput
): Promise<ReplaceOwnedListingResult> {
  if (input.type === "funding") {
    throw new Error("Funding listings are not currently supported")
  }

  const { data: row, error: rowErr } = await supabase
    .from("listings")
    .select(
      "id, type, status, created_by, deleted_at, payment_required, payment_amount, payment_currency, payment_status, stripe_checkout_session_id, reviewed_at, reviewed_by"
    )
    .eq("id", listingId)
    .single()

  if (rowErr || !row) {
    throw new Error("Listing not found")
  }

  if (row.deleted_at) {
    throw new Error("Listing not found")
  }

  if (row.created_by !== userId) {
    throw new Error("Forbidden")
  }

  if (row.type !== input.type) {
    throw new Error("Changing listing type is not supported")
  }

  const priorStatus = row.status as string
  const wasApprovedResubmit = priorStatus === "approved"

  // 1) Demote approved / rejected so child RLS allows full replace (must run before deletes).
  if (priorStatus === "approved" || priorStatus === "rejected") {
    const { error: demoteErr } = await supabase
      .from("listings")
      .update({
        status: "pending",
        resubmitted_at: new Date().toISOString(),
      })
      .eq("id", listingId)
      .eq("created_by", userId)

    if (demoteErr) {
      throw new Error(`Failed to reopen listing for edit: ${demoteErr.message}`)
    }
  }

  const meta = buildPersistableListingMeta(
    input.base.meta as Record<string, unknown> | undefined,
    input.base.contact_email
  )

  const { error: baseErr } = await supabase
    .from("listings")
    .update({
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
      meta,
    })
    .eq("id", listingId)
    .eq("created_by", userId)

  if (baseErr) {
    throw new Error(`Failed to update listing: ${baseErr.message}`)
  }

  const listingType = input.type as Exclude<ListingType, "funding">
  const tbl = detailTable[listingType]

  const details = { ...input.details } as Record<string, unknown>

  const detailsSubtype = details.subtype as string | undefined
  if (input.type === "performance" && detailsSubtype === "ORGANIZER") {
    if (!details.title) {
      throw new Error("Performance ORGANIZER must have a title")
    }
  }

  if (input.type === "audition" && !details.artist_type) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("artist_status")
      .eq("id", userId)
      .single()
    if (profile?.artist_status) {
      details.artist_type = profile.artist_status === "established" ? "ESTABLISHED" : "EMERGING"
    } else {
      details.artist_type = "EMERGING"
    }
  }

  enforceEstablishedPlatformListingFeeFields(input.type, details)
  nullEmergingPlatformListingFeeFields(input.type, details)
  if (input.type === "class") validateClassParentConstraint(details)

  const { error: detailErr } = await supabase.from(tbl).update(scrubDetailRow(details)).eq("listing_id", listingId)

  if (detailErr) {
    throw new Error(`Failed to update ${tbl}: ${detailErr.message}`)
  }

  const { error: delOccErr } = await supabase.from("listing_occurrences").delete().eq("listing_id", listingId)
  if (delOccErr) throw new Error(`Failed to clear occurrences: ${delOccErr.message}`)

  const { error: delPhotoErr } = await supabase.from("listing_photos").delete().eq("listing_id", listingId)
  if (delPhotoErr) throw new Error(`Failed to clear photos: ${delPhotoErr.message}`)

  const { error: delRelErr } = await supabase
    .from("listing_relationships")
    .delete()
    .or(`child_listing_id.eq.${listingId},parent_listing_id.eq.${listingId}`)
  if (delRelErr) throw new Error(`Failed to clear relationships: ${delRelErr.message}`)

  const { error: delPieceErr } = await supabase.from("piece_details").delete().eq("listing_id", listingId)
  if (delPieceErr) throw new Error(`Failed to clear piece details: ${delPieceErr.message}`)

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
    const { error: insOccErr } = await supabase.from("listing_occurrences").insert(occurrencesToInsert)
    if (insOccErr) throw new Error(`Failed to insert occurrences: ${insOccErr.message}`)
  }

  if (input.photos?.length) {
    const photosToInsert = input.photos.slice(0, 5).map((p, idx) => {
      const sortOrder = p.sort_order ?? idx
      const clampedSortOrder = Math.max(0, Math.min(9, sortOrder))
      return {
        listing_id: listingId,
        path: p.path,
        credit: p.credit ?? null,
        sort_order: clampedSortOrder,
      }
    })
    const { error: insPhotoErr } = await supabase.from("listing_photos").insert(photosToInsert)
    if (insPhotoErr) throw new Error(`Failed to insert photos: ${insPhotoErr.message}`)
  }

  if (input.piece_details) {
    const hasParentListing = !!input.piece_details.parent_listing_id
    const hasManualParent = !!input.piece_details.parent_event_name
    if (!hasParentListing && !hasManualParent) {
      throw new Error("Piece details must have either parent_listing_id or parent_event_name")
    }
    const { error: insPieceErr } = await supabase.from("piece_details").insert({
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
    if (insPieceErr) throw new Error(`Failed to insert piece_details: ${insPieceErr.message}`)
  }

  const parentListingId =
    input.parent_listing_id || input.piece_details?.parent_listing_id || (details as { parent_listing_id?: string }).parent_listing_id || null

  let relationshipType = input.relationship_type
  if (parentListingId && !relationshipType) {
    if (input.type === "performance" && detailsSubtype === "PIECE") {
      relationshipType = "performance_piece"
    } else if (input.type === "class" && (details as { class_workshop_type?: string }).class_workshop_type === "CLASS") {
      relationshipType = "workshop_class"
    }
  }

  if (parentListingId && relationshipType) {
    const { error: relErr } = await supabase.from("listing_relationships").insert({
      parent_listing_id: parentListingId,
      child_listing_id: listingId,
      relationship_type: relationshipType,
      created_by: userId,
    })
    if (relErr) throw new Error(`Failed to create relationship: ${relErr.message}`)
  }

  const feeResult = await calculateListingFee({
    listingType: input.type,
    listingId,
    supabase,
  })

  const paymentRequired = feeResult !== null
  const paymentAmount = feeResult?.amount ?? null
  const paymentCurrency = feeResult?.currency ?? "usd"

  const prevAmount = row.payment_amount as number | null | undefined
  const prevPaymentStatus = row.payment_status as string
  const prevStripeSession = row.stripe_checkout_session_id as string | null

  let paymentStatus: string
  let listingStatus: string

  if (!paymentRequired) {
    if (prevPaymentStatus === "paid" || prevPaymentStatus === "refunded") {
      paymentStatus = prevPaymentStatus
    } else {
      paymentStatus = "not_required"
    }
    listingStatus = "pending"
  } else {
    paymentStatus = "requires_payment"
    listingStatus = "pending_payment"
  }

  const paymentPatch: Record<string, unknown> = {
    payment_required: paymentRequired,
    payment_amount: paymentAmount,
    payment_currency: paymentCurrency,
    payment_status: paymentStatus,
    status: listingStatus,
  }

  const amountChanged = paymentAmount !== prevAmount
  if (paymentStatus === "requires_payment") {
    const keepStripeSession =
      prevPaymentStatus === "requires_payment" && !amountChanged && !!prevStripeSession
    if (!keepStripeSession) {
      paymentPatch.stripe_checkout_session_id = null
    }
  }

  const { error: payErr } = await supabase.from("listings").update(paymentPatch).eq("id", listingId).eq("created_by", userId)

  if (payErr) {
    throw new Error(`Failed to update payment fields: ${payErr.message}`)
  }

  return {
    id: listingId,
    payment_required: paymentRequired,
    status: listingStatus,
    was_approved_resubmit: wasApprovedResubmit,
  }
}
