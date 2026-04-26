"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { PhotoUploader } from "@/components/forms/blocks/PhotoUploader"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { TextField } from "@/components/forms/blocks/TextField"
import { ListingFeeSection } from "./performance/ListingFeeSection"
import { ClassWorkshopListingFeeSection } from "./class-workshop/ClassWorkshopListingFeeSection"
import { type EventType } from "../EventTypeSelector"
import { useMemo } from "react"

interface MediaAndAdditionalInfoStepProps {
  form: UseFormReturn<EventFormData>
  eventType: EventType
}

export function MediaAndAdditionalInfoStep({ form, eventType }: MediaAndAdditionalInfoStepProps) {
  const occurrences = useWatch({
    control: form.control,
    name: "occurrences" as Path<EventFormData>,
  }) as Array<{ date: string; times: Array<{ time: string }> }> | undefined

  const classWorkshopType = useWatch({
    control: form.control,
    name: "classWorkshopType",
  }) as "CLASS" | "WORKSHOP" | undefined

  const occurrenceCount = useMemo(() => {
    if (!occurrences || !Array.isArray(occurrences)) return 0
    return occurrences.length
  }, [occurrences])

  const isWorkshop = classWorkshopType === "WORKSHOP"
  const showListingFee = eventType === "PERFORMANCE" || eventType === "CLASS"

  return (
    <>
      <Section title="Media Uploads">
        <PhotoUploader
          form={form}
          name={"promoFiles"}
          label="Promotional Images"
          description="Images are highly encouraged for marketing! Please upload up to 5 images."
        />
        <TextAreaField
          form={form}
          name={"credits"}
          label="Image Description / Photo Credit"
          placeholder="Describe the images and provide photo credit"
          rows={3}
        />
        <TextField
          form={form}
          name={"socialHandles"}
          label="Social Media Handles"
          placeholder="@username"
        />
      </Section>

      {showListingFee && (
        <>
          {eventType === "PERFORMANCE" && <ListingFeeSection form={form} />}
          {eventType === "CLASS" && (
            <ClassWorkshopListingFeeSection
              form={form}
              isWorkshop={isWorkshop}
              occurrenceCount={occurrenceCount}
            />
          )}
        </>
      )}

      <Section title="Additional Information">
        <TextAreaField
          form={form}
          name={"notes"}
          label="Anything else you'd like us to know?"
          placeholder="Additional information"
          rows={4}
        />
      </Section>
    </>
  )
}
