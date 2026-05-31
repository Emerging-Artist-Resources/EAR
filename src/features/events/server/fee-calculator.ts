import type { SupabaseClient } from "@supabase/supabase-js"
import { getPlatformListingFeeContext } from "@/lib/fees/listing-fee-policy"

export interface ListingFeeParams {
  listingType: "performance" | "audition" | "creative" | "class"
  listingId: string
  supabase: SupabaseClient
}

export async function calculateListingFee(
  params: ListingFeeParams
): Promise<{ amount: number; currency: string } | null> {
  const { listingType, listingId, supabase } = params

  if (listingType === "class") {
    const { data: classDetails, error } = await supabase
      .from("class_workshop_details")
      .select("listing_fee_option")
      .eq("listing_id", listingId)
      .single()

    if (error || !classDetails) {
      return null
    }

    const ctx = getPlatformListingFeeContext({
      listingType: "class",
      listingFeeOption: classDetails.listing_fee_option,
    })

    if (!ctx.feeApplies || ctx.amountUsd == null) {
      return null
    }

    return {
      amount: ctx.amountUsd * 100,
      currency: "usd",
    }
  }

  if (listingType === "performance") {
    const { data: perfDetails, error } = await supabase
      .from("performance_details")
      .select("listing_fee_option")
      .eq("listing_id", listingId)
      .single()

    if (error || !perfDetails) {
      return null
    }

    const ctx = getPlatformListingFeeContext({
      listingType: "performance",
      listingFeeOption: perfDetails.listing_fee_option,
    })

    if (!ctx.feeApplies || ctx.amountUsd == null) {
      return null
    }

    return {
      amount: ctx.amountUsd * 100,
      currency: "usd",
    }
  }

  if (listingType === "audition") {
    const { data: auditionDetails, error } = await supabase
      .from("audition_details")
      .select("fee, artist_type")
      .eq("listing_id", listingId)
      .single()

    if (error || !auditionDetails) {
      return null
    }

    if (!auditionDetails.artist_type) {
      return null
    }

    const ctx = getPlatformListingFeeContext({
      listingType: "audition",
      artistType: auditionDetails.artist_type,
      listingFeeOption: auditionDetails.fee,
    })

    if (!ctx.feeApplies || ctx.amountUsd == null) {
      return null
    }

    return {
      amount: ctx.amountUsd * 100,
      currency: "usd",
    }
  }

  if (listingType === "creative") {
    const { data: creativeDetails, error } = await supabase
      .from("creative_details")
      .select("fee, artist_type")
      .eq("listing_id", listingId)
      .single()

    if (error || !creativeDetails) {
      return null
    }

    if (!creativeDetails.artist_type) {
      return null
    }

    const ctx = getPlatformListingFeeContext({
      listingType: "creative",
      artistType: creativeDetails.artist_type,
      listingFeeOption: creativeDetails.fee,
    })

    if (!ctx.feeApplies || ctx.amountUsd == null) {
      return null
    }

    return {
      amount: ctx.amountUsd * 100,
      currency: "usd",
    }
  }

  return null
}
