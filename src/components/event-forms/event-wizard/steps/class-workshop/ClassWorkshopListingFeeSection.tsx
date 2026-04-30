"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { useEffect } from "react"
import { EventFormData } from "@/lib/validations/events"
import { calculateClassFees } from "./fee-utils"
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

  const artistType: "ESTABLISHED" | "EMERGING" | undefined =
    artistStatus === "established"
      ? "ESTABLISHED"
      : artistStatus === "emerging"
        ? "EMERGING"
        : undefined

  const artistTypeField = useWatch({
    control: form.control,
    name: "artistType" as Path<EventFormData>,
  }) as "ESTABLISHED" | "EMERGING" | undefined

  useEffect(() => {
    if (artistType && !isLoading) {
      form.setValue("artistType" as Path<EventFormData>, artistType as unknown as never)
    }
  }, [artistType, isLoading, form])

  const effectiveArtistType = artistTypeField || artistType
  const feeCalculation = calculateClassFees(isWorkshop, occurrenceCount, effectiveArtistType)

  useEffect(() => {
    if (effectiveArtistType === "ESTABLISHED") {
      form.setValue("listingFeeOption" as Path<EventFormData>, "PAY_FEE" as unknown as never)
      form.setValue("listingFeeExplanation" as Path<EventFormData>, "" as unknown as never)
      form.setValue("guestSpotInfo" as Path<EventFormData>, "" as unknown as never)
      form.clearErrors(["listingFeeOption", "listingFeeExplanation", "guestSpotInfo"] as unknown as never)
      return
    }

    if (effectiveArtistType === "EMERGING") {
      form.setValue("listingFeeOption" as Path<EventFormData>, undefined as unknown as never)
      form.setValue("listingFeeExplanation" as Path<EventFormData>, "" as unknown as never)
      form.setValue("guestSpotInfo" as Path<EventFormData>, "" as unknown as never)
      form.clearErrors(["listingFeeOption", "listingFeeExplanation", "guestSpotInfo"] as unknown as never)
    }
  }, [effectiveArtistType, form])

  const feeCalculationForDisplay =
    effectiveArtistType === "ESTABLISHED" ? feeCalculation || undefined : undefined

  return (
    <ListingFeeDisplay
      artistType={effectiveArtistType}
      isFirstSubmission={isFirstSubmission}
      isLoading={isLoading}
      establishedFee={25}
      emergingFee={35}
      emergingListingWaived
      feeCalculation={feeCalculationForDisplay}
    />
  )
}
