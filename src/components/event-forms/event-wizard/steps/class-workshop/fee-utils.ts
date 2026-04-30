import {
  ESTABLISHED_BASE_FEE_USD,
  EMERGING_BASE_FEE_USD,
  EXTRA_CLASS_FEE_USD,
  calculateClassListingFeeUsd,
  type ClassListingFeeCalculation,
  type ListingArtistType,
} from "@/lib/fees/listing-fee-policy"

export const ESTABLISHED_BASE_FEE = ESTABLISHED_BASE_FEE_USD
export const EMERGING_BASE_FEE = EMERGING_BASE_FEE_USD
export const EXTRA_DATE_FEE = EXTRA_CLASS_FEE_USD

export type FeeCalculation = ClassListingFeeCalculation

export function calculateClassFees(
  isWorkshop: boolean,
  occurrenceCount: number,
  artistType: "ESTABLISHED" | "EMERGING" | undefined
): FeeCalculation | null {
  return calculateClassListingFeeUsd(isWorkshop, occurrenceCount, artistType as ListingArtistType | undefined)
}

export function formatFeeBreakdown(fee: FeeCalculation): string {
  if (fee.extraFees === 0) return ""
  const dateText = fee.occurrenceCount - 1 === 1 ? "date" : "dates"
  return ` = $${fee.baseFee} base + $${fee.extraFees} for ${fee.occurrenceCount - 1} additional ${dateText}`
}

