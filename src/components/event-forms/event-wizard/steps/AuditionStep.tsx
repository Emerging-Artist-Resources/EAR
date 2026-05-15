"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { SimpleFeeDisplay } from "@/components/event-forms/event-wizard/shared/SimpleFeeDisplay"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { ShowtimesList } from "@/components/forms/blocks/ShowtimesList"
import { LocationSection } from "@/components/forms/blocks/LocationSection"
import { SelectBlock } from "@/components/forms/blocks/Select"
import { ListingWebsiteField } from "@/components/forms/blocks/ListingWebsiteField"
import { Button } from "@/components/ui/button"
import { useCallback, useEffect } from "react"
import { AUDITION_FEE_LISTING_POLICY_TOOLTIP } from "@/lib/fees/listing-fee-policy"

interface AuditionStepProps {
  form: UseFormReturn<EventFormData>
}

type OccurrenceRow = {
  date?: string
  times?: Array<{ time?: string }>
}

export function AuditionStep({ form }: AuditionStepProps) {
  // consume form for fields via blocks
  // const e = errors as FieldErrors<EventFormData>
  const fee = form.watch("fee") as string | undefined
  const isFee = fee === "FEE"

  const auditionOccurrences = useWatch({
    control: form.control,
    name: "occurrences" as Path<EventFormData>,
  }) as OccurrenceRow[] | undefined

  const canUseAuditionDateForDeadline =
    Array.isArray(auditionOccurrences) &&
    auditionOccurrences.length > 0 &&
    String(auditionOccurrences[0]?.date ?? "").trim() !== ""

  const handleSameAsAuditionDate = useCallback(() => {
    const occ = form.getValues("occurrences" as Path<EventFormData>) as OccurrenceRow[] | undefined
    const first = occ?.[0]
    if (!first || !String(first.date ?? "").trim()) return

    const times =
      Array.isArray(first.times) && first.times.length > 0
        ? first.times.map((t) => ({ time: String(t?.time ?? "") }))
        : [{ time: "" }]

    const row: OccurrenceRow = {
      date: String(first.date ?? ""),
      times,
    }

    form.setValue("deadlineOccurrences" as Path<EventFormData>, [row] as unknown as never, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }, [form])

  useEffect(() => {
    if (!isFee) {
      form.setValue("feeAmount", "")
      form.setValue("artistType" as Path<EventFormData>, undefined as unknown as never)
      form.clearErrors(["feeAmount", "artistType"] as unknown as never)
    }
  }, [isFee, form])

  return (
    <>
      <Section title="Audition Details">
        <TextField form={form} name={"title"} label="Audition Name" required />
        <ListingWebsiteField form={form} />
        <TextAreaField
          form={form}
          name={"description"}
          label="Opportunity Description"
          required
          placeholder="Provide an overview of the company, contract terms, and key details. Include duration, compensation, location, and rehearsal/performance commitments."
        />
        <TextAreaField
          form={form}
          name={"eligibility"}
          label="Eligibility"
          required
          placeholder="Describe who you are seeking and who is eligible to apply. Include style, age range, experience level, and any other relevant qualifications."
        />
        <TextField
          form={form}
          name={"compensation"}
          label="Compensation"
          required
          placeholder="Specify compensation amount or describe any non-monetary compensation."
        />
      </Section>

      <Section title="Audition Instructions">
        <TextAreaField
          form={form}
          name={"instructions"}
          label="Instructions"
          required
          placeholder="Provide submission and audition details, including links, prescreen requirements, email address, and other instructions."
        />
        <TextAreaField
          form={form}
          name={"preAuditionClasses"}
          label="Pre-Audition Opportunities"
          placeholder="Are there any recommended classes, workshops, or intensives prior to auditioning?"
        />
        </Section>
        <Section title="Audition Fee">
        <div>
          <SelectBlock
            form={form}
            options={[{ label: "Yes", value: "FEE" }, { label: "No", value: "NO_FEE" }]}
            name={"fee"}
            label="Is there an audition fee?"
            labelTooltip={AUDITION_FEE_LISTING_POLICY_TOOLTIP}
            required
          />
        </div>
        {isFee && (
          <TextField form={form} name={"feeAmount"} label="Audition Fee Amount" required placeholder="$ or description" />
        )}
        </Section>

      <Section title="Key Dates">
        <ShowtimesList
          form={form as unknown as UseFormReturn<Record<string, unknown>>}
          name={"occurrences"}
          maxDates={1}
          maxTimesPerDate={1}
          title="Audition Date"
          titleTooltip="If you have multiple audition dates, list them in the audition instructions."
          required
          rowLabel="Audition date"
        />
        <ShowtimesList
          form={form as unknown as UseFormReturn<Record<string, unknown>>}
          name={"deadlineOccurrences"}
          maxDates={1}
          maxTimesPerDate={1}
          title="Application Deadline"
          note="If no application deadline exists, you may match it to the audition date and time."
          required
          rowLabel="Application deadline"
          betweenNoteAndRows={
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                disabled={!canUseAuditionDateForDeadline}
                onClick={handleSameAsAuditionDate}
                title={
                  !canUseAuditionDateForDeadline
                    ? "Enter your audition date first"
                    : undefined
                }
              >
                Same as audition date
              </Button>
            </div>
          }
        />
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
          required
        />
      </Section>

      {isFee && (
        <SimpleFeeDisplay
          form={form}
          artistTypeFieldName={"artistType" as Path<EventFormData>}
          feeVariant="audition"
        />
      )}
    </>
  )
}