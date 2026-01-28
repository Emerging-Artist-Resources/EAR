"use client"

import { UseFormReturn } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"

import { Section } from "@/components/forms/blocks/Section"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { OrganizerDatesTimes } from "@/components/event-forms/event-wizard/steps/performance/OrganizerDatesTimes"


export function OrganizerSoloForm({ form }: { form: UseFormReturn<EventFormData> }) {
  return (
    <>
      <OrganizerDatesTimes form={form} />
      <Section title="Artist Credits (encouraged)">
        <TextAreaField
          form={form}
          name={"event_participants"}
          label="Please list all artists and collaborators to be credited for this program"
          placeholder="Include names, roles, and associated work titles, if applicable."
        />
      </Section>
    </>
  )
}
