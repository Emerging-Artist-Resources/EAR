export type ListingArtistType = "ESTABLISHED" | "EMERGING"
export type ListingType = "performance" | "audition" | "creative" | "class"

export const ESTABLISHED_BASE_FEE_USD = 25
export const EMERGING_BASE_FEE_USD = 35
export const EXTRA_CLASS_FEE_USD = 5
export const AUDITION_CREATIVE_FEE_USD = 25

export interface ClassListingFeeCalculation {
  baseFee: number
  extraFees: number
  totalFee: number
  occurrenceCount: number
}

export function getBaseListingFeeUsd(artistType: ListingArtistType): number {
  return artistType === "ESTABLISHED" ? ESTABLISHED_BASE_FEE_USD : EMERGING_BASE_FEE_USD
}

export function calculateClassListingFeeUsd(
  isWorkshop: boolean,
  occurrenceCount: number,
  artistType: ListingArtistType | undefined
): ClassListingFeeCalculation | null {
  if (!artistType) return null

  const baseFee = getBaseListingFeeUsd(artistType)
  const extraFees =
    isWorkshop || occurrenceCount <= 1 ? 0 : (occurrenceCount - 1) * EXTRA_CLASS_FEE_USD

  return {
    baseFee,
    extraFees,
    totalFee: baseFee + extraFees,
    occurrenceCount,
  }
}

export function isEmergingListingWaived(listingType: ListingType): boolean {
  return listingType === "performance" || listingType === "class"
}
