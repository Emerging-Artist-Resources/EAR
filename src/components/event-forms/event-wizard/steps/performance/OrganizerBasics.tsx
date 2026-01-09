"use client"

import { UseFormReturn } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { Dropdown } from "@/components/forms/blocks/Dropdown"

export function OrganizerBasics({ form }: { form: UseFormReturn<EventFormData> }) {
  return (
    <Section title="Event basics">
      <Dropdown
        form={form}
        name={"event_type"}
        label="Is this a solo show, split bill, or festival?"
        required
        placeholder="Select event type..."
        options={[
          { label: "Solo show", value: "SOLO" },
          { label: "Split bill", value: "SPLIT_BILL" },
          { label: "Festival", value: "FESTIVAL" },
        ]}
      />

      <TextField form={form} name={"event_title"} label="Show Name" required />
      <TextField form={form} name={"event_organizer"} label="Organizer / Presenting Company" required />

      <TextField form={form} name={"event_website"} label="Website" type="url" placeholder="https://..." />
      <TextField
        form={form}
        name={"event_ticket_link"}
        label="Ticket Link"
        type="url"
        placeholder="https://..."
        required
      />
      <TextField
        form={form}
        name={"event_cost"}
        label="Ticket Cost"
        placeholder="e.g., $20 / Free / Sliding scale"
        required
      />

      <TextAreaField form={form} name={"event_description"} label="Short Show Description" required rows={4} />

    </Section>
  )
}
