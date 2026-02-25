"use client"

import { UseFormReturn, Path } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { SimpleListingFeeSection } from "@/components/event-forms/event-wizard/shared/SimpleListingFeeSection"

export function ListingFeeSection({ form }: { form: UseFormReturn<EventFormData> }) {
  return (
    <SimpleListingFeeSection
      form={form}
      artistTypeFieldName={"artistType" as Path<EventFormData>}
      feeOptionFieldName={"listingFeeOption" as Path<EventFormData>}
      explanationFieldName={"listingFeeExplanation" as Path<EventFormData>}
      complementaryFieldName={"complementaryTicketInfo" as Path<EventFormData>}
    />
  )
}
