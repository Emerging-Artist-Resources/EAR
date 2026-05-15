"use client"

import { useEffect, useRef } from "react"
import type { MutableRefObject } from "react"
import { UseFormReturn, Path, useWatch } from "react-hook-form"

import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { SelectBlock } from "@/components/forms/blocks/Select"

import { OrganizerFlow } from "@/components/event-forms/event-wizard/steps/performance/OrganizerFlow"
import { PieceSubmissionFlow } from "@/components/event-forms/event-wizard/steps/performance/PieceSubmissionFlow"
import type { OrganizerProgramPiecePhoto } from "@/lib/organizer-program-pieces"

type PerfType = "ORGANIZER" | "PIECE"

interface PerformanceDetailsStepProps {
  form: UseFormReturn<EventFormData>
  organizerPiecePhotosByIdRef?: MutableRefObject<Record<string, OrganizerProgramPiecePhoto[]>>
}

export function PerformanceDetailsStep({
  form,
  organizerPiecePhotosByIdRef,
}: PerformanceDetailsStepProps) {
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
      form.setValue("organizer", "" as never, { shouldValidate: false })
      form.clearErrors("selectedSlots")
      form.clearErrors("extraOccurrences")
    }
    prevPerfTypeRef.current = perfType
  }, [perfType, form])

  return (
    <Section title="Select your role">
      <SelectBlock
        form={form}
        name={"type"}
        label="Select your role"
        required
        options={[
          {
            label:
              "Primary Lister (Organizer / Producer / Presenter) — Submitting the primary event listing. Submitting my own performance or event.",
            value: "ORGANIZER",
          },
          {
            label:
              "Participating Artist — Submitting work within an existing performance, shared program, or festival.",
            value: "PIECE",
          },
        ]}
      />

      {perfType === "ORGANIZER" && (
        <OrganizerFlow form={form} organizerPiecePhotosByIdRef={organizerPiecePhotosByIdRef} />
      )}
      {perfType === "PIECE" && <PieceSubmissionFlow form={form} />}
    </Section>
  )
}
