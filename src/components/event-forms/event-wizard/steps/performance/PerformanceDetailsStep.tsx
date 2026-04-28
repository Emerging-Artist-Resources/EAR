"use client"

import { useEffect, useRef } from "react"
import { UseFormReturn, Path, useWatch } from "react-hook-form"

import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { SelectBlock } from "@/components/forms/blocks/Select"

import { OrganizerFlow } from "@/components/event-forms/event-wizard/steps/performance/OrganizerFlow"
import { PieceSubmissionFlow } from "@/components/event-forms/event-wizard/steps/performance/PieceSubmissionFlow"

type PerfType = "ORGANIZER" | "PIECE"

interface PerformanceDetailsStepProps {
  form: UseFormReturn<EventFormData>
}

export function PerformanceDetailsStep({ form }: PerformanceDetailsStepProps) {
  const perfType = useWatch({
    control: form.control,
    name: "type" as Path<EventFormData>,
  }) as PerfType | undefined

  const prevPerfTypeRef = useRef<PerfType | undefined>(undefined)

  useEffect(() => {
    const prev = prevPerfTypeRef.current
    if (perfType === "PIECE" && prev === "ORGANIZER") {
      if (process.env.NODE_ENV !== "production") {
        console.log("[EAR piece schedule] type switch ORGANIZER → PIECE (resetting organizer schedule fields)", {
          occurrencesBefore: form.getValues("occurrences"),
          eventDatesConfirmedBefore: form.getValues("eventDatesConfirmed"),
        })
      }
      form.setValue("occurrences", [] as never, { shouldValidate: false, shouldDirty: true })
      form.setValue("eventDatesConfirmed", false as never, { shouldValidate: false })
      form.clearErrors("occurrences")
    }
    if (perfType === "ORGANIZER" && prev === "PIECE") {
      if (process.env.NODE_ENV !== "production") {
        console.log("[EAR piece schedule] type switch PIECE → ORGANIZER (resetting piece schedule fields)", {
          selectedSlotsBefore: form.getValues("selectedSlots"),
          extraOccurrencesBefore: form.getValues("extraOccurrences"),
        })
      }
      form.setValue("selectedSlots", [] as never, { shouldValidate: false, shouldDirty: true })
      form.setValue("extraOccurrences", [] as never, { shouldValidate: false, shouldDirty: true })
      form.clearErrors("selectedSlots")
      form.clearErrors("extraOccurrences")
    }
    prevPerfTypeRef.current = perfType
  }, [perfType, form])

  return (
    <Section title="Performance submission">
      <SelectBlock
        form={form}
        name={"type"}
        label="What are you submitting?"
        required
        options={[
          { label: "Organizer/Producer: Submitting my own performance or event", value: "ORGANIZER" },
          { label: "Participating Artist: Submitting a work within a larger event or festival", value: "PIECE" },
        ]}
      />

      {perfType === "ORGANIZER" && <OrganizerFlow form={form} />}
      {perfType === "PIECE" && <PieceSubmissionFlow form={form} />}

    </Section>
  )
}
