"use client"

import { UseFormReturn, Path } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { Text } from "@/components/ui/typography"
import { Section } from "@/components/forms/blocks/Section"
import { useSyncArtistTypeFromProfile } from "@/hooks/use-sync-artist-type-from-profile"

interface SimpleFeeDisplayProps {
  form: UseFormReturn<EventFormData>
  artistTypeFieldName: Path<EventFormData>
  amountUsd: number
}

/**
 * EAR listing fee for audition / creative when the listing includes a participant fee (fee === FEE).
 * Organizer-entered feeAmount describes their own fee on the listing, not this charge.
 */
export function SimpleFeeDisplay({
  form,
  artistTypeFieldName,
  amountUsd,
}: SimpleFeeDisplayProps) {
  const { artistType, isLoading } = useSyncArtistTypeFromProfile(form, artistTypeFieldName)

  if (isLoading) {
    return (
      <Section title="Listing Fee">
        <Text className="text-sm text-gray-500">Loading eligibility status...</Text>
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

  return (
    <Section title="Listing Fee">
      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md space-y-2">
        <Text className="text-sm font-medium text-gray-900">Listing fee: ${amountUsd}</Text>
        <Text className="text-xs text-gray-700">
          You will be asked to pay ${amountUsd} after submitting.
        </Text>
      </div>
    </Section>
  )
}
