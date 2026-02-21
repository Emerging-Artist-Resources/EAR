"use client"

import { Text } from "@/components/ui/typography"
import { Section } from "@/components/forms/blocks/Section"

interface ListingFeeDisplayProps {
  artistType: "ESTABLISHED" | "EMERGING" | undefined
  isFirstSubmission: boolean
  isLoading: boolean
  establishedFee: number
  emergingFee: number
  children?: React.ReactNode
  feeCalculation?: {
    totalFee: number
    baseFee: number
    extraFees: number
    occurrenceCount: number
  }
}

/**
 * Shared component for displaying listing fee information
 * Handles common logic: loading state, first submission free, established vs emerging
 */
export function ListingFeeDisplay({
  artistType,
  isFirstSubmission,
  isLoading,
  establishedFee,
  //emergingFee,
  children,
  feeCalculation,
}: ListingFeeDisplayProps) {
  if (isLoading) {
    return (
      <Section title="Listing Fee">
        <Text className="text-sm text-gray-500">Loading eligibility status...</Text>
      </Section>
    )
  }

  // TODO: Show free listing for first submission once events database is finalized
  const isFree = isFirstSubmission && false // TODO: Enable once first submission check is implemented

  if (isFree) {
    return (
      <Section title="Listing Fee">
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <Text className="text-sm font-medium text-gray-900">Listing Fee: Free</Text>
          <Text className="text-xs text-gray-600 mt-1">
            This is your first submission, so the listing fee is waived.
          </Text>
        </div>
      </Section>
    )
  }

  if (!artistType) {
    return (
      <Section title="Listing Fee">
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <Text className="text-sm font-medium text-gray-900">Unable to determine eligibility status</Text>
          <Text className="text-xs text-gray-600 mt-1">
            Please ensure your profile eligibility status is set in your profile settings.
          </Text>
        </div>
      </Section>
    )
  }

  if (artistType === "ESTABLISHED") {
    const displayFee = feeCalculation ? feeCalculation.totalFee : establishedFee
    const hasExtraFees = feeCalculation && feeCalculation.extraFees > 0

    return (
      <Section title="Listing Fee">
        <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-md">
          <Text className="text-sm font-medium text-gray-900">
            Listing Fee: ${displayFee}
            {hasExtraFees && (
              <span className="text-xs font-normal text-gray-600 ml-2">
                (${feeCalculation!.baseFee} base + ${feeCalculation!.extraFees} for{" "}
                {feeCalculation!.occurrenceCount - 1} additional date
                {feeCalculation!.occurrenceCount - 1 !== 1 ? "s" : ""})
              </span>
            )}
          </Text>
          <Text className="text-xs text-gray-600 mt-1">
            {feeCalculation && hasExtraFees ? (
              <>
                As an established artist, your base listing fee is ${feeCalculation.baseFee}.
                {" "}Additional fees apply for multiple class dates ($10 per additional date).
                {" "}Payment will be processed after submission.
              </>
            ) : (
              "Payment will be processed after submission."
            )}
          </Text>
        </div>
      </Section>
    )
  }

  // For emerging artists, render the children (which contains the fee options)
  return <Section title="Listing Fee">{children}</Section>
}
