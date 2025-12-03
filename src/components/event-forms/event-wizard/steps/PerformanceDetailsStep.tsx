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
import { SelectBlock } from "@/components/forms/blocks/Select"
import { useEffect } from "react"


interface PerformanceDetailsStepProps {
  form: UseFormReturn<EventFormData>
}

export function PerformanceDetailsStep({ form }: PerformanceDetailsStepProps) {
  // consume form for fields via blocks
  // const e = errors as FieldErrors<EventFormData>
  const perfType = form.watch("type") as string | undefined
  const isFestival = perfType === "FESTIVAL"
  
  const isSplitBill = perfType === "SPLIT_BILL"
  const isOther = perfType === "OTHER"

  useEffect(() => {
    if (!isFestival) {
      form.setValue("festival_name", "")
      form.setValue("festival_link", "")
      form.clearErrors(["festival_name", "festival_link"] as unknown as never)
    }
    if (!isSplitBill) {
      form.setValue("title", "")
      form.clearErrors(["title"] as unknown as never)
    }
   
  }, [isFestival, isSplitBill, form])
  return (
    <>
      <Section title="Performance Association">
        <SelectBlock form={form} name={"type"} label="Is your performance part of a festival or split bill?" required options={[
          { label: "No", value: "NO" }, 
          { label: "Festival", value: "FESTIVAL" }, 
          { label: "Split Bill", value: "SPLIT_BILL" }, 
        ]} allowOther={true} otherLabel="Other" otherName="otherType" otherValue="OTHER" />

        {isFestival && (
          <>
            <TextField form={form} name={"festival_name"} label="Name of Festival" required placeholder="Festival Name"/>
            <TextField form={form} name={"festival_link"} label="Link to Festival" type="url" required placeholder="https://festival.example.com"/>
          </>
        )}

        {isSplitBill && (
          <>
            <TextField form={form} name={"split_bill_name"} label="Name of Split Bill" required placeholder="Split Bill Name"/>
            <TextField form={form} name={"split_bill_link"} label="Link to Split Bill" type="url" required placeholder="https://splitbill.example.com"/>
          </>
        )}

      
        </Section>

      <Section title="Performance Details">

        <TextField form={form} name={"title"} label="Performance Title" required placeholder="Performance Title"/>

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