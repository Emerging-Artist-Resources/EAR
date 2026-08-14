"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { PhotoUploader } from "@/components/forms/blocks/PhotoUploader"
import { ListingPhotoManager } from "@/components/forms/blocks/ListingPhotoManager"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { TextField } from "@/components/forms/blocks/TextField"
import type { ListingStatus } from "@/features/events/server/repository-types"
import type { ListingPhotoDraftItem } from "@/lib/listings/listing-photo-draft"
import { type EventType } from "../EventTypeSelector"

interface MediaAndAdditionalInfoStepProps {
  form: UseFormReturn<EventFormData>
  eventType: EventType
  /** Edit mode: single ordered draft for listing promo photos. */
  listingPhotoDraft?: ListingPhotoDraftItem[]
  onListingPhotoDraftChange?: (next: ListingPhotoDraftItem[]) => void
  listingStatus?: ListingStatus | null
}

export function MediaAndAdditionalInfoStep({
  form,
  eventType,
  listingPhotoDraft,
  onListingPhotoDraftChange,
  listingStatus,
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
  const isEditingListingPhotos =
    listingPhotoDraft != null && typeof onListingPhotoDraftChange === "function"

  const isFestivalOrSplitOrganizer =
    eventType === "PERFORMANCE" &&
    perfSubtype === "ORGANIZER" &&
    (perfEventType === "SPLIT_BILL" || perfEventType === "FESTIVAL")

  const promoImagesLabel = isFestivalOrSplitOrganizer ? "Festival / program images" : "Promotional Images"

  const promoImagesDescription = isFestivalOrSplitOrganizer
    ? "Promotional images for the overall event, festival, or shared program (not individual pieces). The first image is the listing display image. Keep, remove, or add up to 5 total."
    : isAudition || isClassListing || isOpportunity
      ? "The first image is the listing display image. Keep, remove, or add up to 5 total."
      : "Images are highly encouraged for marketing! The first image is the listing display image. Keep, remove, or add up to 5 total."

  const createPromoDescription = isFestivalOrSplitOrganizer
    ? "Promotional images for the overall event, festival, or shared program (not individual pieces). Upload up to 5 images (recommended)."
    : isAudition || isClassListing || isOpportunity
      ? "Upload up to 5 images (recommended)."
      : "Images are highly encouraged for marketing! Please upload up to 5 images."

  return (
    <>
      <Section title="Media Uploads">
        <div>
          {isEditingListingPhotos ? (
            <ListingPhotoManager
              items={listingPhotoDraft}
              onChange={onListingPhotoDraftChange}
              listingStatus={listingStatus}
              label={promoImagesLabel}
              description={promoImagesDescription}
            />
          ) : (
            <PhotoUploader
              form={form}
              name={"promoFiles"}
              label={promoImagesLabel}
              description={createPromoDescription}
            />
          )}
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
