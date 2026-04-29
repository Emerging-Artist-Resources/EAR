"use client"

import { UseFormReturn, Path } from "react-hook-form"
import { useEffect } from "react"
import { EventFormData } from "@/lib/validations/events"
import { useProfileEligibility } from "@/hooks/use-profile-eligibility"
import { Text } from "@/components/ui/typography"
import { Section } from "@/components/forms/blocks/Section"
import { EAR_AUDITION_CREATIVE_LISTING_FEE_USD } from "@/lib/listing-fee-amounts"

export type OrganizerFeeVariant = "audition" | "creative"

interface SimpleFeeDisplayProps {
  form: UseFormReturn<EventFormData>
  artistTypeFieldName: Path<EventFormData>
  feeVariant: OrganizerFeeVariant
}

/**
 * EAR listing fee for audition / creative when the listing includes a participant fee (fee === FEE).
 * Amount is fixed ($25); organizer-entered feeAmount describes their own fee on the listing, not this charge.
 */
export function SimpleFeeDisplay({ form, artistTypeFieldName }: SimpleFeeDisplayProps) {
  const { artistStatus, isLoading } = useProfileEligibility()

  const artistType: "ESTABLISHED" | "EMERGING" | undefined =
    artistStatus === "established"
      ? "ESTABLISHED"
      : artistStatus === "emerging"
        ? "EMERGING"
        : undefined

  useEffect(() => {
    if (artistType && !isLoading) {
      form.setValue(artistTypeFieldName, artistType as unknown as never)
    }
  }, [artistType, isLoading, form, artistTypeFieldName])

  const feeUsd = EAR_AUDITION_CREATIVE_LISTING_FEE_USD

  if (isLoading) {
    return (
      <Section title="Fee">
        <Text className="text-sm text-gray-500">Loading eligibility status...</Text>
      </Section>
    )
  }

  if (!artistType) {
    return (
      <Section title="Fee">
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <Text className="text-sm font-medium text-gray-900">Unable to determine eligibility status</Text>
          <Text className="text-xs text-gray-600 mt-1">
            Please ensure your profile eligibility status is set in your profile settings.
          </Text>
        </div>
      </Section>
    )
  }

  return (
    <Section title="Fee">
      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md space-y-2">
        <Text className="text-sm font-medium text-gray-900">
          Listing fee: ${feeUsd} 
        </Text>
        <Text className="text-xs text-gray-700">
          You will be asked to pay ${feeUsd} after submitting.
        </Text>
      </div>
    </Section>
  )
}
