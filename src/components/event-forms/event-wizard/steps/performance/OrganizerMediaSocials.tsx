"use client"

import { UseFormReturn } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { PhotoUploader } from "@/components/forms/blocks/PhotoUploader"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { TextField } from "@/components/forms/blocks/TextField"

export function OrganizerMediaSocials({ form }: { form: UseFormReturn<EventFormData> }) {
  return (
    <Section title="Images & Socials">
      <PhotoUploader form={form} name={"event_promoFiles"} label="Promotional images" description="Images are highly encouraged for marketing! Please upload up to 5 images." />
      <TextAreaField
        form={form}
        name={"event_photo_credits"}
        label="Image Description / Photo Credit"
        placeholder="Describe the images and provide photo credit"
        rows={3}
      />
      <TextField form={form} name={"event_social_handles"} label="Social Media Handles" placeholder="@..."                  />
    </Section>
  )
}
