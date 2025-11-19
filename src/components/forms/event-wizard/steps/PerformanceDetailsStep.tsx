"use client"

import { UseFormReturn } from "react-hook-form"
// import { Input } from "@/components/ui/input"
// import { Textarea } from "@/components/ui/textarea"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { DateTimeList } from "@/components/forms/blocks/DateTimeList"
import { LocationField } from "@/components/forms/blocks/LocationField"
import { PhotoUploader } from "@/components/forms/blocks/PhotoUploader"

interface PerformanceDetailsStepProps {
  form: UseFormReturn<EventFormData>
}

export function PerformanceDetailsStep({ form }: PerformanceDetailsStepProps) {
  // consume form for fields via blocks
  // const e = errors as FieldErrors<EventFormData>
  return (
    <>
      <Section title="Performance Details">
        <TextField form={form} name={"title"} label="Show Name" required placeholder="Show title" />

        <DateTimeList form={form} primaryDateName={"date"} primaryTimeName={"showTime"} extrasName={"extraOccurrences"} />

        <LocationField form={form} addressName={"location"} instructionsName={"additionalInstructions"} label="Show Location" instructionsLabel="Additional Instructions" />
      </Section>

      {/* Ticket price now on its own row after dates/times */}
      <Section title="Ticket Details">
        <TextField form={form} name={"ticketPrice"} label="Ticket Price" required type="number" placeholder="20.00" prefix="$" />

        <TextField form={form} name={"ticketLink"} label="Ticket Link" placeholder="https://tickets.example.com" />
      </Section>
      
      <Section title="Media Uploads">
        <PhotoUploader form={form} name={"promoFiles"} />
        <TextAreaField form={form} name={"imageCreditInfo"} label="Image Description / Photo Credit" placeholder="Describe the images and provide photo credit" rows={3} />
      </Section>
      
      <TextAreaField form={form} name={"shortDescription"} label="Short Description (max 100 words)" required placeholder="Describe your event" rows={4} />
    </>
  )
}


