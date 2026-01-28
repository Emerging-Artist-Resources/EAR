"use client"

import { UseFormReturn, Path } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { DateTimeList } from "@/components/forms/blocks/DateTimeList"
import { LocationField } from "@/components/forms/blocks/LocationField"
import { PhotoUploader } from "@/components/forms/blocks/PhotoUploader"
import { SelectBlock } from "@/components/forms/blocks/Select"
import { useEffect } from "react"
import { SimpleFeeDisplay } from "@/components/event-forms/event-wizard/shared/SimpleFeeDisplay"

interface AuditionStepProps {
  form: UseFormReturn<EventFormData>
}

export function AuditionStep({ form }: AuditionStepProps) {
  // consume form for fields via blocks
  // const e = errors as FieldErrors<EventFormData>
  const auditionFee = form.watch("auditionFee") as string | undefined
  const isAuditionFee = auditionFee === "FEE"

  useEffect(() => {
    if (!isAuditionFee) {
      form.setValue("auditionFeeAmount", "")
      form.setValue("auditionArtistType" as Path<EventFormData>, undefined as unknown as never)
      form.clearErrors(["auditionFeeAmount", "auditionArtistType"] as unknown as never)
    }
  }, [isAuditionFee, form])

  return (
    <>
      <Section title="Audition Details">
        <TextField form={form} name={"auditionName"} label="Audition Name" required/>
        <TextAreaField form={form} name={"aboutProject"} label="Describe the Opportunity" required placeholder="Please provide an overview of the company, contract terms, and key details of the audition opportunity. Include duration, compensation, location, and rehearsal/performance commitments. "/>
        <TextAreaField form={form} name={"eligibility"} label="Eligibility" required placeholder="Please describe who you are seeking and who is eligible to apply. Include relevant details such as style, age, experience, and any other qualifications."/>
        <TextField form={form} name={"compensation"} label="Compensation" required placeholder="Specify the amount, or describe any non-monetary compensation offered"/>
        <TextAreaField form={form} name={"auditionInstructions"} label="Audition Instructions" required placeholder="Please describe your audition instructions. Include submission link, email, and all prescreen requirements."/>
        <TextAreaField form={form} name={"auditionClasses"} label="Are there any preaudition classes, workshops, or intensives that are recommended prior to auditioning?"/>

        
        <SelectBlock form={form} options={[{ label: "Yes", value: "FEE" }, { label: "No", value: "NO_FEE" }]} name={"auditionFee"} label="Is there an audition fee?" required />
        {isAuditionFee && (
          <>
            <TextField form={form} name={"auditionFeeAmount"} label="Audition Fee Amount" required placeholder="$ or description"/>
          </>
        )}
      </Section>

      <Section title="Key Dates">
        <DateTimeList form={form as unknown as UseFormReturn<Record<string, unknown>>} name={"auditionOccurrences"} maxDates={1} maxTimesPerDate={1} title="Audition Date" note="If you have multiple audition dates, list them in the additional information section" required/>
        <DateTimeList form={form as unknown as UseFormReturn<Record<string, unknown>>} name={"deadlineOccurrences"} maxDates={1} maxTimesPerDate={1} title="Deadline" note="If you don't have a deadline, use the audition date" required/>
      </Section>

      <Section title="Location">
        <LocationField form={form} addressName={"address"} venueName={"venueName"} placeIdName={"placeId"} latName={"lat"} lngName={"lng"} instructionsName={"instructions"} instructionsNote="If you are not releasing the location, please use this space to explain how and when participants will be notified." instructionsPlaceholder=""/>
      </Section>

      <Section title="Media Uploads">
        <PhotoUploader form={form} name={"promoFiles"} label="Promotional Images" description="Images are highly encouraged for marketing! Please upload up to 5 images." />
        <TextAreaField form={form} name={"credits"} label="Image Description / Photo Credit" placeholder="Describe the images and provide photo credit" rows={3}/>
        <TextField form={form} name={"socialHandles"} label="Social Media Handles" placeholder="@..."/>
      </Section>


      <Section title="Additional Information">
        <TextAreaField form={form} name={"notes"} label="Anything else you'd like us to know?" placeholder="Additional information" rows={4} />
      </Section>

    
      {isAuditionFee && (
        <SimpleFeeDisplay
          form={form}
          artistTypeFieldName={"auditionArtistType" as Path<EventFormData>}
        />
      )}
    </>
  )
}