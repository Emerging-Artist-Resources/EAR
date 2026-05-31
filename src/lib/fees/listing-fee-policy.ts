export type ListingArtistType = "ESTABLISHED" | "EMERGING"
export type ListingType = "performance" | "audition" | "creative" | "class"

/** Shown beside the audition fee Yes/No control in the listing wizard. */
export const AUDITION_FEE_LISTING_POLICY_TOOLTIP =
  "Please note: auditions with audition fees are subject to a listing fee."

/** Shown beside the opportunity application fee Yes/No control in the listing wizard. */
export const OPPORTUNITY_APPLICATION_FEE_LISTING_POLICY_TOOLTIP =
  "Please note: opportunities with application fees are subject to a listing fee."

/** Reserved for future tiered pricing. Artist type currently does not affect pricing. */
export const ESTABLISHED_BASE_FEE_USD = 25
/** Reserved for future tiered pricing. Artist type currently does not affect pricing. */
export const EMERGING_BASE_FEE_USD = 35
export const EXTRA_CLASS_FEE_USD = 5
export const AUDITION_CREATIVE_FEE_USD = 25

export type PlatformListingFeeCondition = "participant_fee"

export type PlatformListingFeeRule =
  | { kind: "waived" }
  | {
      kind: "conditional"
      feeUsd: number
      condition: PlatformListingFeeCondition
    }

export const PLATFORM_LISTING_FEE_RULES: Record<ListingType, PlatformListingFeeRule> = {
  performance: { kind: "waived" },
  class: { kind: "waived" },
  audition: { kind: "conditional", feeUsd: AUDITION_CREATIVE_FEE_USD, condition: "participant_fee" },
  creative: { kind: "conditional", feeUsd: AUDITION_CREATIVE_FEE_USD, condition: "participant_fee" },
}

export interface PlatformListingFeeContext {
  /** Whether EAR charges a platform listing fee for this submission */
  feeApplies: boolean
  amountUsd: number | null
  /** Whether this listing type supports persisting platform fee configuration fields */
  allowsFeeConfiguration: boolean
}

export interface PlatformListingFeeContextInput {
  listingType: ListingType
  artistType?: ListingArtistType
  /** performance/class: listing_fee_option; audition/creative: fee === "FEE" maps to PAY_FEE */
  listingFeeOption?: string | null
  /** For class extra-date math when tiered pricing returns */
  occurrenceCount?: number
}

const WAIVED_CONTEXT: PlatformListingFeeContext = {
  feeApplies: false,
  amountUsd: null,
  allowsFeeConfiguration: false,
}

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

function evaluateConditionalRule(
  rule: Extract<PlatformListingFeeRule, { kind: "conditional" }>,
  listingFeeOption?: string | null
): PlatformListingFeeContext {
  if (rule.condition === "participant_fee") {
    if (listingFeeOption === "PAY_FEE") {
      return {
        feeApplies: true,
        amountUsd: rule.feeUsd,
        allowsFeeConfiguration: true,
      }
    }
    return WAIVED_CONTEXT
  }

  return WAIVED_CONTEXT
}

export function getPlatformListingFeeContext(
  input: PlatformListingFeeContextInput
): PlatformListingFeeContext {
  const rule = PLATFORM_LISTING_FEE_RULES[input.listingType]

  if (rule.kind === "waived") {
    return WAIVED_CONTEXT
  }

  if (rule.kind === "conditional") {
    return evaluateConditionalRule(rule, input.listingFeeOption)
  }

  return WAIVED_CONTEXT
}

function getListingFeeOptionFromDetails(
  type: ListingType,
  details: Record<string, unknown>
): string | null | undefined {
  if (type === "audition" || type === "creative") {
    return details.fee as string | null | undefined
  }
  return details.listing_fee_option as string | null | undefined
}

/** Normalize detail rows so platform fee fields match listing-type policy. */
export function applyPlatformListingFeePolicy(
  type: ListingType,
  details: Record<string, unknown>
): void {
  const listingFeeOption = getListingFeeOptionFromDetails(type, details)
  const ctx = getPlatformListingFeeContext({
    listingType: type,
    artistType: details.artist_type as ListingArtistType | undefined,
    listingFeeOption,
  })

  if (ctx.allowsFeeConfiguration) {
    return
  }

  if (type === "performance") {
    details.listing_fee_option = null
    details.listing_fee_explanation = null
    details.complementary_ticket_info = null
  } else if (type === "class") {
    details.listing_fee_option = null
    details.listing_fee_explanation = null
    details.guest_spot_info = null
  } else if (type === "audition" || type === "creative") {
    details.fee = null
  }
}
