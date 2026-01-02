"use client"

import { UseFormReturn, Path } from "react-hook-form"

import { EventFormData } from "@/lib/validations/events"
import { OrganizerBasics } from "@/components/event-forms/event-wizard/steps/performance/OrganizerBasics"
import { OrganizerSoloForm } from "@/components/event-forms/event-wizard/steps/performance/OrganizerSoloForm"
import { OrganizerMultiProgramForm } from "@/components/event-forms/event-wizard/steps/performance/OrganizerMultiProgramForm"

type EventType = "SOLO" | "SPLIT_BILL" | "FESTIVAL"

export function OrganizerFlow({ form }: { form: UseFormReturn<EventFormData> }) {
  const eventType = form.watch("event_type" as Path<EventFormData>) as EventType | undefined
  const isMulti = eventType === "SPLIT_BILL" || eventType === "FESTIVAL"

  return (
    <>
      <OrganizerBasics form={form} />
      {isMulti ? <OrganizerMultiProgramForm form={form} /> : <OrganizerSoloForm form={form} />}
    </>
  )
}