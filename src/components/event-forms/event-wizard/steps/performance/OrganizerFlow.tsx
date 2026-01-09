"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"

import { EventFormData } from "@/lib/validations/events"
import { OrganizerBasics } from "@/components/event-forms/event-wizard/steps/performance/OrganizerBasics"
import { OrganizerSoloForm } from "@/components/event-forms/event-wizard/steps/performance/OrganizerSoloForm"
import { OrganizerMultiProgramForm } from "@/components/event-forms/event-wizard/steps/performance/OrganizerMultiProgramForm"
import { ListingFeeSection } from "./ListingFeeSection"
import { OrganizerMediaSocials } from "./OrganizerMediaSocials"
import { Section } from "@/components/forms/blocks/Section"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"

type EventType = "SOLO" | "SPLIT_BILL" | "FESTIVAL"

export function OrganizerFlow({ form }: { form: UseFormReturn<EventFormData> }) {
  const eventType = useWatch({
    control: form.control,
    name: "event_type" as Path<EventFormData>,
  }) as EventType | undefined
  const isMulti = eventType === "SPLIT_BILL" || eventType === "FESTIVAL"

  return (
    <>
      <OrganizerBasics form={form} />
      {isMulti ? <OrganizerMultiProgramForm form={form} /> : <OrganizerSoloForm form={form} />}
      <OrganizerMediaSocials form={form} />
      <Section title="Additional Information">
        <TextAreaField form={form} name={"notes"} label="Anything else you'd like us to know?" placeholder="Additional information" rows={4} />
      </Section>
      <ListingFeeSection form={form} />
    </>
  )
}