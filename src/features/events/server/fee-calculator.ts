import type { SupabaseClient } from "@supabase/supabase-js"

export const ESTABLISHED_BASE_FEE = 50
export const EMERGING_BASE_FEE = 35
export const EXTRA_DATE_FEE = 10

export interface FeeCalculation {
  baseFee: number
  extraFees: number
  totalFee: number
  occurrenceCount: number
}

function calculateClassFees(
  isWorkshop: boolean,
  occurrenceCount: number,
  artistType: "ESTABLISHED" | "EMERGING" | undefined
): FeeCalculation | null {
  if (!artistType) return null

  const baseFee = artistType === "ESTABLISHED" ? ESTABLISHED_BASE_FEE : EMERGING_BASE_FEE
  const extraFees = isWorkshop || occurrenceCount <= 1 ? 0 : (occurrenceCount - 1) * EXTRA_DATE_FEE
  const totalFee = baseFee + extraFees

  return {
    baseFee,
    extraFees,
    totalFee,
    occurrenceCount,
  }
}

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
      .select("class_workshop_type, artist_type, listing_fee_option")
      .eq("listing_id", listingId)
      .single()

    if (error || !classDetails) {
      return null
    }

    if (classDetails.listing_fee_option !== "PAY_FEE") {
      return null
    }

    if (!classDetails.artist_type) {
      return null
    }

    const { data: occurrences } = await supabase
      .from("listing_occurrences")
      .select("id")
      .eq("listing_id", listingId)
      .eq("occurrence_type", "event")

    const occurrenceCount = occurrences?.length || 0
    const isWorkshop = classDetails.class_workshop_type === "WORKSHOP"

    const feeCalc = calculateClassFees(isWorkshop, occurrenceCount, classDetails.artist_type)
    if (!feeCalc) {
      return null
    }

    return {
      amount: feeCalc.totalFee * 100,
      currency: "usd",
    }
  }

  if (listingType === "performance") {
    const { data: perfDetails, error } = await supabase
      .from("performance_details")
      .select("listing_fee_option, artist_type")
      .eq("listing_id", listingId)
      .single()

    if (error || !perfDetails) {
      return null
    }

    if (perfDetails.listing_fee_option !== "PAY_FEE") {
      return null
    }

    if (!perfDetails.artist_type) {
      return null
    }

    const baseFee = perfDetails.artist_type === "ESTABLISHED" ? ESTABLISHED_BASE_FEE : EMERGING_BASE_FEE

    return {
      amount: baseFee * 100,
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

    if (auditionDetails.fee !== "PAY_FEE") {
      return null
    }

    if (!auditionDetails.artist_type) {
      return null
    }

    const baseFee = auditionDetails.artist_type === "ESTABLISHED" ? ESTABLISHED_BASE_FEE : EMERGING_BASE_FEE

    return {
      amount: baseFee * 100,
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

    if (creativeDetails.fee !== "PAY_FEE") {
      return null
    }

    if (!creativeDetails.artist_type) {
      return null
    }

    const baseFee = creativeDetails.artist_type === "ESTABLISHED" ? ESTABLISHED_BASE_FEE : EMERGING_BASE_FEE

    return {
      amount: baseFee * 100,
      currency: "usd",
    }
  }

  return null
}
