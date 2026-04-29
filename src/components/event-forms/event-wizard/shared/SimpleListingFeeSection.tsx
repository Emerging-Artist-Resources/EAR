"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { useEffect } from "react"
import { EventFormData } from "@/lib/validations/events"
import { SelectBlock } from "@/components/forms/blocks/Select"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { Text } from "@/components/ui/typography"
import { useProfileEligibility } from "@/hooks/use-profile-eligibility"
import { ListingFeeDisplay } from "./ListingFeeDisplay"

interface SimpleListingFeeSectionProps {
  form: UseFormReturn<EventFormData>
  artistTypeFieldName: Path<EventFormData>
  feeOptionFieldName: Path<EventFormData>
  explanationFieldName: Path<EventFormData>
  complementaryFieldName?: Path<EventFormData>
  establishedFee?: number
  emergingFee?: number
  emergingOptions?: Array<{ label: string; value: string }>
  complementaryLabel?: string
  explanationLabel?: string
  /** Performance/class: emerging artists have no platform listing fee UI or charges. */
  emergingListingWaived?: boolean
}

/**
 * Shared listing fee component for organizer performance listings.
 * Established: platform listing fee; emerging (when not waived): pay / comp / waiver.
 */
export function SimpleListingFeeSection({
  form,
  artistTypeFieldName,
  feeOptionFieldName,
  explanationFieldName,
  complementaryFieldName,
  establishedFee = 50,
  emergingFee = 35,
  emergingListingWaived = false,
  emergingOptions = [
    { label: `Pay listing fee ($${emergingFee})`, value: "PAY_FEE" },
    { label: "Provide a complementary ticket", value: "PROVIDE" },
    { label: "Fee & Comp Ticket Waiver Request", value: "EXPLAIN" },
  ],
  complementaryLabel = "Complementary Ticket Information",
  explanationLabel = "Please explain your situation",
}: SimpleListingFeeSectionProps) {
  const { artistStatus, isFirstSubmission, isLoading } = useProfileEligibility()
  
  // Map profile eligibility status to form artistType
  const artistType: "ESTABLISHED" | "EMERGING" | undefined = artistStatus === "established" 
    ? "ESTABLISHED" 
    : artistStatus === "emerging" 
    ? "EMERGING" 
    : undefined

  const listingFeeOption = useWatch({
    control: form.control,
    name: feeOptionFieldName,
  }) as "PAY_FEE" | "PROVIDE" | "EXPLAIN" | undefined

  // Set artistType in form based on profile eligibility
  useEffect(() => {
    if (artistType && !isLoading) {
      form.setValue(artistTypeFieldName, artistType as unknown as never)
    }
  }, [artistType, isLoading, form, artistTypeFieldName])

  // Clear platform listing fee fields when not collecting them (established or waived emerging)
  useEffect(() => {
    if (artistType === "ESTABLISHED" || (emergingListingWaived && artistType === "EMERGING")) {
      form.setValue(feeOptionFieldName, undefined as unknown as never)
      form.setValue(explanationFieldName, "" as unknown as never)
      if (complementaryFieldName) {
        form.setValue(complementaryFieldName, "" as unknown as never)
      }
      const fieldsToClear = [feeOptionFieldName, explanationFieldName]
      if (complementaryFieldName) fieldsToClear.push(complementaryFieldName)
      form.clearErrors(fieldsToClear as unknown as never)
    }
  }, [
    artistType,
    emergingListingWaived,
    form,
    feeOptionFieldName,
    explanationFieldName,
    complementaryFieldName,
  ])

  // Clear conditional fields based on option selected
  useEffect(() => {
    if (listingFeeOption !== "PROVIDE" && complementaryFieldName) {
      form.setValue(complementaryFieldName, "" as unknown as never)
      form.clearErrors([complementaryFieldName] as unknown as never)
    }
    if (listingFeeOption !== "EXPLAIN") {
      form.setValue(explanationFieldName, "" as unknown as never)
      form.clearErrors([explanationFieldName] as unknown as never)
    }
  }, [listingFeeOption, form, explanationFieldName, complementaryFieldName])

  return (
    <ListingFeeDisplay
      artistType={artistType}
      isFirstSubmission={isFirstSubmission}
      isLoading={isLoading}
      establishedFee={establishedFee}
      emergingFee={emergingFee}
      emergingListingWaived={emergingListingWaived}
    >
      {artistType === "EMERGING" && !emergingListingWaived && (
        <div className="mt-4 space-y-4">
          <SelectBlock
            form={form}
            name={feeOptionFieldName}
            label="How would you like to handle the listing fee?"
            required
            options={emergingOptions}
          />

          {listingFeeOption === "PROVIDE" && complementaryFieldName && (
            <TextAreaField
              form={form}
              name={complementaryFieldName}
              label={complementaryLabel}
              required
              rows={4}
            />
          )}

          {listingFeeOption === "EXPLAIN" && (
            <TextAreaField
              form={form}
              name={explanationFieldName}
              label={explanationLabel}
              required
              rows={4}
            />
          )}

          {listingFeeOption === "PAY_FEE" && (
            <div className="p-4 bg-primary-50 border border-primary-200 rounded-md">
              <Text className="text-sm font-medium text-gray-900">Listing Fee: ${emergingFee}</Text>
              <Text className="text-xs text-gray-600 mt-1">Payment will be processed after submission.</Text>
            </div>
          )}
        </div>
      )}
    </ListingFeeDisplay>
  )
}
