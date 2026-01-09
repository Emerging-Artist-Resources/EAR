"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"

import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { SelectBlock } from "@/components/forms/blocks/Select"

import { OrganizerFlow } from "@/components/event-forms/event-wizard/steps/performance/OrganizerFlow"
import { PieceSubmissionFlow } from "@/components/event-forms/event-wizard/steps/performance/PieceSubmissionFlow"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { ListingFeeSection } from "./ListingFeeSection"
import { OrganizerMediaSocials } from "./OrganizerMediaSocials"

type PerfType = "ORGANIZER" | "PIECE"

interface PerformanceDetailsStepProps {
  form: UseFormReturn<EventFormData>
}

export function PerformanceDetailsStep({ form }: PerformanceDetailsStepProps) {
  const perfType = useWatch({
    control: form.control,
    name: "type" as Path<EventFormData>,
  }) as PerfType | undefined

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
