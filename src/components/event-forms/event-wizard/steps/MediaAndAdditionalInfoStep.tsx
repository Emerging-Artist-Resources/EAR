"use client"

import type { MutableRefObject } from "react"
import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { PhotoUploader } from "@/components/forms/blocks/PhotoUploader"
import { PieceExistingImageThumbnails } from "@/components/forms/blocks/PieceExistingImageThumbnails"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { TextField } from "@/components/forms/blocks/TextField"
import { type EventType } from "../EventTypeSelector"

interface MediaAndAdditionalInfoStepProps {
  form: UseFormReturn<EventFormData>
  eventType: EventType
  existingPhotosRef?: MutableRefObject<Array<{ path: string; credit?: string | null }>>
}

export function MediaAndAdditionalInfoStep({
  form,
  eventType,
  existingPhotosRef,
}: MediaAndAdditionalInfoStepProps) {
  const perfSubtype = useWatch({
    control: form.control,
    name: "type" as Path<EventFormData>,
  }) as "ORGANIZER" | "PIECE" | undefined

  const perfEventType = useWatch({
    control: form.control,
    name: "eventType" as Path<EventFormData>,
  }) as "SOLO" | "SPLIT_BILL" | "FESTIVAL" | undefined

  const isAudition = eventType === "AUDITION"
  const isClassListing = eventType === "CLASS"
  const isOpportunity = eventType === "CREATIVE"

  const isFestivalOrSplitOrganizer =
    eventType === "PERFORMANCE" &&
    perfSubtype === "ORGANIZER" &&
    (perfEventType === "SPLIT_BILL" || perfEventType === "FESTIVAL")

  const promoImagesLabel = isFestivalOrSplitOrganizer ? "Festival / program images" : "Promotional Images"

  const promoImagesDescription = isFestivalOrSplitOrganizer
    ? "Promotional images for the overall event, festival, or shared program (not individual pieces). Upload up to 5 images (recommended)."
    : isAudition || isClassListing || isOpportunity
      ? "Upload up to 5 images (recommended)."
      : "Images are highly encouraged for marketing! Please upload up to 5 images."

  const existingPhotoPaths =
    existingPhotosRef?.current?.map((p) => p.path).filter(Boolean) ?? []

  return (
    <>
      <Section title="Media Uploads">
        <div>
          <PieceExistingImageThumbnails paths={existingPhotoPaths} />
          <PhotoUploader
            form={form}
            name={"promoFiles"}
            label={promoImagesLabel}
            description={promoImagesDescription}
          />
        </div>
        <TextAreaField
          form={form}
          name={"credits"}
          label="Image description/photo credit"
          placeholder={isAudition || isClassListing || isOpportunity ? undefined : "Describe the images and provide photo credit"}
          rows={3}
        />
        <TextField
          form={form}
          name={"socialHandles"}
          label="Social media handle(s)"
          placeholder="@username"
        />
      </Section>

      <Section title="Additional Information">
        <TextAreaField
          form={form}
          name={"notes"}
          label={
            isAudition || isClassListing || isOpportunity ? "Additional Information" : "Anything else you'd like us to know?"
          }
          placeholder={
            isAudition || isClassListing || isOpportunity
              ? "Provide any other relevant details."
              : "Additional information"
          }
          rows={4}
        />
      </Section>
    </>
  )
}
