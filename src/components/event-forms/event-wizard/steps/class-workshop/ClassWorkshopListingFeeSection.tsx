"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { useEffect } from "react"
import { EventFormData } from "@/lib/validations/events"
import { SelectBlock } from "@/components/forms/blocks/Select"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { Text } from "@/components/ui/typography"
import { calculateClassFees, formatFeeBreakdown } from "./fee-utils"
import { useProfileEligibility } from "@/hooks/use-profile-eligibility"
import { ListingFeeDisplay } from "@/components/event-forms/event-wizard/shared/ListingFeeDisplay"

interface ClassWorkshopListingFeeSectionProps {
  form: UseFormReturn<EventFormData>
  isWorkshop: boolean
  occurrenceCount: number
}

export function ClassWorkshopListingFeeSection({
  form,
  isWorkshop,
  occurrenceCount,
}: ClassWorkshopListingFeeSectionProps) {
  const { artistStatus, isFirstSubmission, isLoading } = useProfileEligibility()
  
  // Map profile eligibility status to form artistType
  const artistType: "ESTABLISHED" | "EMERGING" | undefined = artistStatus === "established" 
    ? "ESTABLISHED" 
    : artistStatus === "emerging" 
    ? "EMERGING" 
    : undefined

  const artistTypeField = useWatch({
    control: form.control,
    name: "artistType" as Path<EventFormData>,
  }) as "ESTABLISHED" | "EMERGING" | undefined

  const listingFeeOption = useWatch({
    control: form.control,
    name: "listingFeeOption" as Path<EventFormData>,
  }) as "PAY_FEE" | "PROVIDE" | "EXPLAIN" | undefined

  // Set artistType in form based on profile eligibility
  useEffect(() => {
    if (artistType && !isLoading) {
      form.setValue("artistType" as Path<EventFormData>, artistType as unknown as never)
    }
  }, [artistType, isLoading, form])

  const feeCalculation = calculateClassFees(isWorkshop, occurrenceCount, artistTypeField || artistType)

  useEffect(() => {
    if (artistTypeField === "ESTABLISHED") {
      form.setValue("listingFeeOption" as Path<EventFormData>, undefined as unknown as never)
      form.setValue("listingFeeExplanation" as Path<EventFormData>, "" as unknown as never)
      form.setValue("guestSpotInfo" as Path<EventFormData>, "" as unknown as never)
      form.clearErrors(["listingFeeOption", "listingFeeExplanation", "guestSpotInfo"] as unknown as never)
    }
  }, [artistTypeField, form.setValue, form.clearErrors])

  useEffect(() => {
    if (listingFeeOption !== "PROVIDE") {
      form.setValue("guestSpotInfo" as Path<EventFormData>, "" as unknown as never)
      form.clearErrors(["guestSpotInfo"] as unknown as never)
    }
    if (listingFeeOption !== "EXPLAIN") {
      form.setValue("listingFeeExplanation" as Path<EventFormData>, "" as unknown as never)
      form.clearErrors(["listingFeeExplanation"] as unknown as never)
    }
  }, [listingFeeOption, form.setValue, form.clearErrors])

  const effectiveArtistType = artistTypeField || artistType

  return (
    <ListingFeeDisplay
      artistType={effectiveArtistType}
      isFirstSubmission={isFirstSubmission}
      isLoading={isLoading}
      establishedFee={50}
      emergingFee={35}
      feeCalculation={feeCalculation || undefined}
    >
      {effectiveArtistType === "EMERGING" && feeCalculation && (
        <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-md">
          <Text className="text-sm font-medium text-gray-900">
            Listing Fee: ${feeCalculation.totalFee}
            {feeCalculation.extraFees > 0 && (
              <span className="text-xs font-normal text-gray-600 ml-2">
                ($50 base + ${feeCalculation.extraFees} for {feeCalculation.occurrenceCount - 1} additional
                date{feeCalculation.occurrenceCount - 1 !== 1 ? "s" : ""})
              </span>
            )}
          </Text>
          <Text className="text-xs text-gray-600 mt-1">
            As an established artist, your base listing fee is $50.
            {feeCalculation.extraFees > 0 && (
              <>
                {" "}Additional fees apply for multiple class dates ($10 per additional date).
              </>
            )}
            {" "}Payment will be processed after submission.
          </Text>
        </div>
      )}

      {artistTypeField === "EMERGING" && feeCalculation && (
        <div className="mt-4 space-y-4">
          <SelectBlock
            form={form}
            name={"listingFeeOption" as Path<EventFormData>}
            label="How would you like to handle the listing fee?"
            required
            options={[
              {
                label: `Pay listing fee ($${feeCalculation.totalFee}${formatFeeBreakdown(feeCalculation)})`,
                value: "PAY_FEE",
              },
              { label: "Provide a guest spot", value: "PROVIDE" },
              {
                label: "Explain why I can't pay the fee or provide a guest spot",
                value: "EXPLAIN",
              },
            ]}
          />

          {listingFeeOption === "PROVIDE" && (
            <TextAreaField
              form={form}
              name={"guestSpotInfo" as Path<EventFormData>}
              label="Guest Spot Information"
              required
              placeholder="Please provide details about the guest spot (date, time, how to claim, etc.)"
              rows={4}
            />
          )}

          {listingFeeOption === "EXPLAIN" && (
            <TextAreaField
              form={form}
              name={"listingFeeExplanation" as Path<EventFormData>}
              label="Please explain your situation"
              required
              placeholder="Please explain why you cannot pay the listing fee or provide a guest spot"
              rows={4}
            />
          )}

          {listingFeeOption === "PAY_FEE" && (
            <div className="p-4 bg-primary-50 border border-primary-200 rounded-md">
              <Text className="text-sm font-medium text-gray-900">
                Listing Fee: ${feeCalculation.totalFee}
                {feeCalculation.extraFees > 0 && (
                  <span className="text-xs font-normal text-gray-600 ml-2">
                    (${feeCalculation.baseFee} base + ${feeCalculation.extraFees} for{" "}
                    {feeCalculation.occurrenceCount - 1} additional date
                    {feeCalculation.occurrenceCount - 1 !== 1 ? "s" : ""})
                  </span>
                )}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">
                Payment will be processed after submission.
              </Text>
            </div>
          )}
        </div>
      )}
    </ListingFeeDisplay>
  )
}

