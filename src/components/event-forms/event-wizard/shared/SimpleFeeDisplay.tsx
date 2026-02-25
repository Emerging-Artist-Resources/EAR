"use client"

import { UseFormReturn, Path } from "react-hook-form"
import { useEffect } from "react"
import { EventFormData } from "@/lib/validations/events"
import { useProfileEligibility } from "@/hooks/use-profile-eligibility"
import { ListingFeeDisplay } from "./ListingFeeDisplay"
import { Text } from "@/components/ui/typography"

interface SimpleFeeDisplayProps {
  form: UseFormReturn<EventFormData>
  artistTypeFieldName: Path<EventFormData>
  establishedFee?: number
  emergingFee?: number
}

/**
 * Simple fee display component for forms that only show the fee (no options)
 * Used by Audition and Opportunity forms
 */
export function SimpleFeeDisplay({
  form,
  artistTypeFieldName,
  establishedFee = 50,
  emergingFee = 35,
}: SimpleFeeDisplayProps) {
  const { artistStatus, isFirstSubmission, isLoading } = useProfileEligibility()
  
  // Map profile eligibility status to form artistType
  const artistType: "ESTABLISHED" | "EMERGING" | undefined = artistStatus === "established" 
    ? "ESTABLISHED" 
    : artistStatus === "emerging" 
    ? "EMERGING" 
    : undefined

  // Set artistType in form based on profile eligibility
  useEffect(() => {
    if (artistType && !isLoading) {
      form.setValue(artistTypeFieldName, artistType as unknown as never)
    }
  }, [artistType, isLoading, form, artistTypeFieldName])

  return (
    <ListingFeeDisplay
      artistType={artistType}
      isFirstSubmission={isFirstSubmission}
      isLoading={isLoading}
      establishedFee={establishedFee}
      emergingFee={emergingFee}
    >
      {artistType === "EMERGING" && (
        <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-md">
          <Text className="text-sm font-medium text-gray-900">Listing Fee: ${emergingFee}</Text>
          <Text className="text-xs text-gray-600 mt-1">
            As an emerging artist, your listing fee is ${emergingFee}. Payment will be processed after submission.
          </Text>
        </div>
      )}
    </ListingFeeDisplay>
  )
}
