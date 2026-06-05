"use client"

import { UseFormReturn, Path } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { ShowtimesList } from "@/components/forms/blocks/ShowtimesList"
import { LocationSection } from "@/components/forms/blocks/LocationSection"
import { LOCATION_UNDISCLOSED_TOOLTIP } from "@/lib/location/tooltips"
import { useEffect } from "react"
import { SelectBlock } from "@/components/forms/blocks/Select"
import { SimpleFeeDisplay } from "@/components/event-forms/event-wizard/shared/SimpleFeeDisplay"
import { ListingWebsiteField } from "@/components/forms/blocks/ListingWebsiteField"
import { OPPORTUNITY_APPLICATION_DEADLINE_CALENDAR_TOOLTIP } from "@/lib/content/opportunity-listing-tooltips"
import {
  OPPORTUNITY_APPLICATION_FEE_LISTING_POLICY_TOOLTIP,
  getPlatformListingFeeContext,
} from "@/lib/fees/listing-fee-policy"

interface OpportunityStepProps {
  form: UseFormReturn<EventFormData>
}

export function OpportunityStep({ form }: OpportunityStepProps) {
  const fee = form.watch("fee") as string | undefined
  const isFee = fee === "FEE"
  const listingFeeContext = getPlatformListingFeeContext({
    listingType: "creative",
    listingFeeOption: isFee ? "PAY_FEE" : null,
  })

  useEffect(() => {
    if (!isFee) {
      form.setValue("feeAmount", "")
      form.setValue("artistType" as Path<EventFormData>, undefined as unknown as never)
      form.clearErrors(["feeAmount", "artistType"] as unknown as never)
    }
  }, [isFee, form])

  return (
    <>
      <Section title="Opportunity Details">
        <TextField form={form} name={"title"} label="Opportunity title" required />
        <TextField
          form={form}
          name={"host"}
          label="Hosting organization or individual(s)"
          required
        />
        <ListingWebsiteField form={form} />
        <TextField
          form={form}
          name={"dates"}
          label="Opportunity dates"
          required
          placeholder="e.g. Rolling through June 30, or specific date range"
        />
        <TextAreaField
          form={form}
          name={"description"}
          label="Opportunity description"
          placeholder="Provide an overview of the opportunity."
          required
          rows={4}
        />
        <TextAreaField
          form={form}
          name={"compensation"}
          label="What is offered"
          placeholder="Include compensation (monetary & non-monetary), commitment dates, and any other key details."
          required
          rows={5}
        />
      </Section>

      <Section title="Application Details">
        <TextAreaField
          form={form}
          name={"requirements"}
          label="Application requirements"
          required
          rows={4}
          placeholder="Summarize what applicants need to submit or qualify."
        />
        <TextAreaField
          form={form}
          name={"creativeSubmissionInstructions"}
          label="Submission instructions"
          placeholder="Include link, contact email, and any required materials."
          required
          rows={4}
        />
        <ShowtimesList
          form={form as unknown as UseFormReturn<Record<string, unknown>>}
          name={"deadlineOccurrences"}
          title="Application deadline"
          titleTooltip={OPPORTUNITY_APPLICATION_DEADLINE_CALENDAR_TOOLTIP}
          note="Add the deadline date and time."
          maxDates={1}
          maxTimesPerDate={1}
          required
          rowLabel="Deadline"
        />
        <SelectBlock
          form={form}
          options={[{ label: "Yes", value: "FEE" }, { label: "No", value: "NO_FEE" }]}
          name={"fee"}
          label="Application fee"
          labelTooltip={OPPORTUNITY_APPLICATION_FEE_LISTING_POLICY_TOOLTIP}
          required
        />
        {isFee && (
          <TextField
            form={form}
            name={"feeAmount"}
            label="Application fee amount"
            required
            placeholder="$ or description"
          />
        )}
      </Section>

      <Section title="Location">
        <LocationSection
          form={form}
          addressName={"address"}
          venueName={"venueName"}
          placeIdName={"placeId"}
          latName={"lat"}
          lngName={"lng"}
          instructionsName={"locationInstructions"}
          labelTooltip={LOCATION_UNDISCLOSED_TOOLTIP}
          required
        />
      </Section>

      {listingFeeContext.feeApplies && listingFeeContext.amountUsd != null && (
        <SimpleFeeDisplay
          form={form}
          artistTypeFieldName={"artistType" as Path<EventFormData>}
          amountUsd={listingFeeContext.amountUsd}
        />
      )}
    </>
  )
}
