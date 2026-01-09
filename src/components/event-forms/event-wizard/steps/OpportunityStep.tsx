"use client"

import { UseFormReturn, Path } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { DateTimeList } from "@/components/forms/blocks/DateTimeList"
import { LocationField } from "@/components/forms/blocks/LocationField"
import { PhotoUploader } from "@/components/forms/blocks/PhotoUploader"
import { Text } from "@/components/ui/typography"
import { useEffect } from "react"
import { SelectBlock } from "@/components/forms/blocks/Select"

interface OpportunityStepProps {
  form: UseFormReturn<EventFormData>
}

export function OpportunityStep({ form }: OpportunityStepProps) {
  // consume form for fields via blocks
  // const e = errors as FieldErrors<EventFormData>
  const opportunityFee = form.watch("opportunityFee") as string | undefined
  const isOpportunityFee = opportunityFee === "FEE"
  useEffect(() => {
    if (!isOpportunityFee) {
      form.setValue("opportunityFeeAmount", "")
      form.setValue("opportunityArtistType" as Path<EventFormData>, undefined as unknown as never)
      form.clearErrors(["opportunityFeeAmount", "opportunityArtistType"] as unknown as never)
    }
  }, [isOpportunityFee, form])

  return (
    <>
      <Section title="Creative Opportunity Details">
        <TextField form={form} name={"opportunityName"} label="Opportunity Name" required placeholder="Opportunity Name"/>
        <TextField form={form} name={"presentingIndividualOrOrganization"} label="Presenting Individual or Organization" required placeholder="Presenting individual or organization"/>
        <TextAreaField form={form} name={"opportunityDescription"} label="Opportunity Description" required placeholder="About the Opportunity"/>
        <TextAreaField form={form} name={"opportunityOffers"} label="What is offered to selected artists?" required placeholder="Include compensation, rehearsal/performance commitments, and any other relevant details."/>       
        <TextAreaField form={form} name={"opportunityRequirements"} label="Application Requirements" required placeholder="What is required to apply?"/>       
        <TextField form={form} name={"opportunityLink"} label="Opportunity Submission Instructions" required placeholder="submission link or instructions"/>
        <SelectBlock form={form} options={[{ label: "Yes", value: "FEE" }, { label: "No", value: "NO_FEE" }]} name={"opportunityFee"} label="Is there an application fee?" required />
        {isOpportunityFee && (
          <>
            <TextField form={form} name={"opportunityFeeAmount"} label="Application Fee Amount" required placeholder="$ or description"/>
            </>
          )}            
      </Section>

      <Section title="Key Dates">
      <TextField form={form} name={"opportunityDates"} label="Opportunity Dates" required placeholder="Opportunity Dates"/>
      <DateTimeList form={form as unknown as UseFormReturn<Record<string, unknown>>} name={"opportunityDeadlineOccurrences"} title="Deadline" maxDates={1} maxTimesPerDate={1} required/>
      </Section>

      <Section title="Location">
        <LocationField form={form} addressName={"address"} venueName={"venueName"} placeIdName={"placeId"} latName={"lat"} lngName={"lng"} instructionsName={"instructions"} instructionsPlaceholder="Include directions for accessing the building or studio or any other relevant information."/>
      </Section>

      <Section title="Media Uploads">
        <PhotoUploader form={form} name={"promoFiles"} label="Promotional Images" description="Images are highly encouraged for marketing! Please upload up to 5 images." />
        <TextAreaField form={form} name={"credits"} label="Image Description / Photo Credit" placeholder="Describe the images and provide photo credit" rows={3}/>
        <TextField form={form} name={"socialHandles"} label="Social Media Handles" placeholder="@..."/>
      </Section>

      <Section title="Additional Information">
        <TextAreaField form={form} name={"notes"} label="Anything else you'd like us to know?" placeholder="Additional information" rows={4} />
      </Section>

      {isOpportunityFee && (
        <>
          <Section title="Listing Fee">
            <SelectBlock
              form={form}
              name={"opportunityArtistType" as Path<EventFormData>}
              label="Are you an established or emerging artist?"
              required
              options={[
                { label: "Established artist", value: "ESTABLISHED" },
                { label: "Emerging artist", value: "EMERGING" },
              ]}
            />

            {(() => {
              const artistType = form.watch("opportunityArtistType" as Path<EventFormData>) as "ESTABLISHED" | "EMERGING" | undefined
              if (artistType === "ESTABLISHED") {
                return (
                  <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-md">
                    <Text className="text-sm font-medium text-gray-900">Listing Fee: $50</Text>
                    <Text className="text-xs text-gray-600 mt-1">
                      As an established artist, your listing fee is $50. Payment will be processed after submission.
                    </Text>
                  </div>
                )
              }
              if (artistType === "EMERGING") {
                return (
                  <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-md">
                    <Text className="text-sm font-medium text-gray-900">Listing Fee: $35</Text>
                    <Text className="text-xs text-gray-600 mt-1">
                      As an emerging artist, your listing fee is $35. Payment will be processed after submission.
                    </Text>
                  </div>
                )
              }
              return null
            })()}
          </Section>
        </>
      )}
    </>
  )
}