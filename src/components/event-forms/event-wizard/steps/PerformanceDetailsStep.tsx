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
        <TextField form={form} name={"title"} label="Show Name" required placeholder="Show title"/>

        <DateTimeList form={form}  title="Performance Dates and Times" primaryDateName={"date"} primaryTimeName={"showTime"} extrasName={"extraOccurrences"} variant="extras" required/>

        <LocationField form={form} addressName={"address"} instructionsName={"addressInstructions"} label="Show Location" instructionsLabel="Additional Instructions" required />
      </Section>

      {/* Ticket price now on its own row after dates/times */}
      <Section title="Ticket Details">
        <TextField form={form} name={"ticketPrice"} label="Ticket Price" required type="text" placeholder="20.00"/>

        <TextField form={form} name={"ticketLink"} label="Ticket Link" required placeholder="https://tickets.example.com" />
      </Section>
      

      <Section title="Show Description & Credits">
        <TextAreaField form={form} name={"shortDescription"} label="Short Description (max 100 words)" required placeholder="Describe your event" rows={4} />
        <TextAreaField form={form} name={"credits"} label="Credit" required placeholder="Who should we list as creator(s), performer(s), or presenting organization?" rows={3} />
        <TextField form={form} name={"socialHandles"} label="Social Handles" required placeholder="@username" />
      </Section>

      <Section title="Media Uploads">
        <PhotoUploader form={form} name={"promoFiles"} label="Promotional Images" description="Upload up to 5 images" />
        <TextAreaField form={form} name={"credits"} label="Image Description / Photo Credit" placeholder="Describe the images and provide photo credit" rows={3}/>
      </Section>
      
      <Section title="Additional Information">
        <TextAreaField form={form} name={"notes"} label="Anything else you'd like to know?" placeholder="Additional information" rows={4} />
      </Section>
    </>
  )
}