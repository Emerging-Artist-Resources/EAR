"use client"

import { UseFormReturn, Path } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { DateTimeList } from "@/components/forms/blocks/DateTimeList"
import { LocationField } from "@/components/forms/blocks/LocationField"
import { PhotoUploader } from "@/components/forms/blocks/PhotoUploader"
import { useEffect } from "react"
import { SelectBlock } from "@/components/forms/blocks/Select"
import { SimpleFeeDisplay } from "@/components/event-forms/event-wizard/shared/SimpleFeeDisplay"

interface OpportunityStepProps {
  form: UseFormReturn<EventFormData>
}

export function OpportunityStep({ form }: OpportunityStepProps) {
  // consume form for fields via blocks
  // const e = errors as FieldErrors<EventFormData>
  const fee = form.watch("fee") as string | undefined
  const isFee = fee === "FEE"

  useEffect(() => {
    if (!isFee) {
      form.setValue("feeAmount", "")
      form.setValue("artistType" as Path<EventFormData>, undefined as unknown as never)
      form.clearErrors(["feeAmount", "artistType"] as unknown as never)
    }
  }, [isFee, form])

  return (
    <>
      <Section title="Creative Opportunity Details">
        <TextField form={form} name={"title"} label="Opportunity Name" required />
        <TextField form={form} name={"host"} label="Hosting Indivdual/Organization" required/>
        <TextField form={form} name={"dates"} label="Opportunity Dates" required placeholder="Opportunity Dates"/>
        <TextAreaField form={form} name={"description"} label="Opportunity Description" required placeholder="About the Opportunity"/>
        <TextAreaField form={form} name={"compensation"} label="What is offered to selected artists?" required placeholder="Include compensation, rehearsal/performance commitments, and any other relevant details."/>       
        <TextAreaField form={form} name={"requirements"} label="Application Requirements" required placeholder="What is required to apply?"/>       
        <TextField form={form} name={"link"} label="Submission Instructions" required placeholder="Include the submission link, contact email, and any additional required information."/>
        <DateTimeList form={form as unknown as UseFormReturn<Record<string, unknown>>} name={"deadlineOccurrences"} title="Submission Deadline" maxDates={1} maxTimesPerDate={1} required/>
        <SelectBlock form={form} options={[{ label: "Yes", value: "FEE" }, { label: "No", value: "NO_FEE" }]} name={"fee"} label="Is there an application fee?" required />
        {isFee && (
          <>
            <TextField form={form} name={"feeAmount"} label="Application Fee Amount" required placeholder="$ or description"/>
            </>
          )}            
      </Section>

      <Section title="Location">
        <LocationField form={form} addressName={"address"} venueName={"venueName"} placeIdName={"placeId"} latName={"lat"} lngName={"lng"} instructionsName={"locationInstructions"} instructionsPlaceholder="Include directions for accessing the building or studio or any other relevant information."/>
      </Section>

      <Section title="Media Uploads">
        <PhotoUploader form={form} name={"promoFiles"} label="Promotional Images" description="Images are highly encouraged for marketing! Please upload up to 5 images." />
        <TextAreaField form={form} name={"credits"} label="Image Description / Photo Credit" placeholder="Describe the images and provide photo credit" rows={3}/>
        <TextField form={form} name={"socialHandles"} label="Social Media Handles" placeholder="@..."/>
      </Section>

      <Section title="Additional Information">
        <TextAreaField form={form} name={"notes"} label="Anything else you'd like us to know?" placeholder="Additional information" rows={4} />
      </Section>

      {isFee && (
        <SimpleFeeDisplay
          form={form}
          artistTypeFieldName={"artistType" as Path<EventFormData>}
        />
      )}
    </>
  )
}