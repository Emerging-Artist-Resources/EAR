"use client"

import { UseFormReturn } from "react-hook-form"
import { useMemo } from "react"

import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { SelectBlock } from "@/components/forms/blocks/Select"

import { OrganizerFlow } from "@/components/event-forms/event-wizard/steps/performance/OrganizerFlow"
import { PieceSubmissionFlow } from "@/components/event-forms/event-wizard/steps/performance/PieceSubmissionFlow"
import { ListingFeeSection } from "@/components/event-forms/event-wizard/steps/performance/ListingFeeSection"

type PerfType = "ORGANIZER" | "PIECE"

interface PerformanceDetailsStepProps {
  form: UseFormReturn<EventFormData>
}

export function PerformanceDetailsStep({ form }: PerformanceDetailsStepProps) {
  const perfType = form.watch("type") as PerfType | undefined

  const submitTypeOptions = useMemo(
    () => [
      { label: "Organizer/Producer: Submitting my own performance or event", value: "ORGANIZER" },
      { label: "Participating Artist: Submitting a work within a larger event or festival", value: "PIECE" },
    ],
    []
  )

  return (
    <Section title="Performance submission">
      <SelectBlock
        form={form}
        name={"type"}
        label="What are you submitting?"
        required
        options={submitTypeOptions}
      />

      {perfType === "ORGANIZER" && <OrganizerFlow form={form} />}
      {perfType === "PIECE" && <PieceSubmissionFlow form={form} />}

      
    </Section>
  )
}
