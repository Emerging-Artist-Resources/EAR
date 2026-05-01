"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { SimpleFeeDisplay } from "@/components/event-forms/event-wizard/shared/SimpleFeeDisplay"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { ShowtimesList } from "@/components/forms/blocks/ShowtimesList"
import { LocationField } from "@/components/forms/blocks/LocationField"
import { SelectBlock } from "@/components/forms/blocks/Select"
import { ListingWebsiteField } from "@/components/forms/blocks/ListingWebsiteField"
import { Button } from "@/components/ui/button"
import { useCallback, useEffect } from "react"

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
        <TextField form={form} name={"title"} label="Audition Name" required/>
        <TextAreaField form={form} name={"description"} label="Describe the Opportunity" required placeholder="Please provide an overview of the company, contract terms, and key details of the audition opportunity. Include duration, compensation, location, and rehearsal/performance commitments. "/>
        <TextAreaField form={form} name={"eligibility"} label="Eligibility" required placeholder="Please describe who you are seeking and who is eligible to apply. Include relevant details such as style, age, experience, and any other qualifications."/>
        <TextField form={form} name={"compensation"} label="Compensation" required placeholder="Specify the amount, or describe any non-monetary compensation offered"/>
        <TextAreaField form={form} name={"instructions"} label="Audition Instructions" required placeholder="Please describe your audition instructions. Include submission link, email, and all prescreen requirements."/>
        <ListingWebsiteField form={form} />
        <TextAreaField form={form} name={"preAuditionClasses"} label="Are there any preaudition classes, workshops, or intensives that are recommended prior to auditioning?"/>

        
        <SelectBlock form={form} options={[{ label: "Yes", value: "FEE" }, { label: "No", value: "NO_FEE" }]} name={"fee"} label="Is there an audition fee?" required />
        {isFee && (
          <>
            <TextField form={form} name={"feeAmount"} label="Audition Fee Amount" required placeholder="$ or description"/>
          </>
        )}
      </Section>

      <Section title="Key Dates">
        <ShowtimesList
          form={form as unknown as UseFormReturn<Record<string, unknown>>}
          name={"occurrences"}
          maxDates={1}
          maxTimesPerDate={1}
          title="Audition Date"
          note="If you have multiple audition dates, list them in the additional information section"
          required
          rowLabel="Audition date"
        />
        <ShowtimesList
          form={form as unknown as UseFormReturn<Record<string, unknown>>}
          name={"deadlineOccurrences"}
          maxDates={1}
          maxTimesPerDate={1}
          title="Deadline"
          note="If you don't have a separate deadline, use the button below to match your audition date and time."
          required
          rowLabel="Deadline"
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
      <LocationField
  form={form}
  addressName={"address"}
  venueName={"venueName"}
  placeIdName={"placeId"}
  latName={"lat"}
  lngName={"lng"}
  instructionsName={"locationInstructions"}
  required
/>      </Section>

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