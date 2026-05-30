"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { Dropdown } from "@/components/forms/blocks/Dropdown"
import { InviteRecipientEmailsSection } from "@/components/event-forms/event-wizard/steps/performance/InviteRecipientEmailsSection"

const SPLIT_FESTIVAL_ORGANIZER_TOOLTIP =
  "For split bills, one listing must be submitted as the primary event. All other participants should submit as Participating Artists to ensure listings are linked."

const INVITE_PARTICIPATING_ARTISTS_TITLE = "Invite participating artists"
const INVITE_PARTICIPATING_ARTISTS_DESCRIPTION =
  "Enter participating artists and companies email addresses. They will receive a notification inviting them to connect their listing to this event."

export function OrganizerBasics({ form }: { form: UseFormReturn<EventFormData> }) {
  const eventType = useWatch({
    control: form.control,
    name: "eventType" as Path<EventFormData>,
  }) as "SOLO" | "SPLIT_BILL" | "FESTIVAL" | undefined

  const isMulti = eventType === "SPLIT_BILL" || eventType === "FESTIVAL"

  return (
    <Section title="Event basics">
      <Dropdown
        form={form}
        name={"eventType"}
        label="Is this a solo show, split bill, or festival?"
        required
        placeholder="Select event type..."
        options={[
          { label: "Solo show", value: "SOLO" },
          { label: "Split bill", value: "SPLIT_BILL" },
          { label: "Festival", value: "FESTIVAL" },
        ]}
      />

      {isMulti ? (
        <>
          <TextField form={form} name={"title"} label="Performance title" required />
          <TextField
            form={form}
            name={"organizer"}
            label="Company or artist name"
            labelTooltip={SPLIT_FESTIVAL_ORGANIZER_TOOLTIP}
            required
          />
          <TextField
            form={form}
            name={"website"}
            label="Company or artist website"
            type="url"
            placeholder="https://..."
          />
         
          <TextField
            form={form}
            name={"link"}
            label="Ticket link"
            type="url"
            placeholder="https://..."
            required
          />
          <TextField
            form={form}
            name={"price"}
            label="Ticket price"
            placeholder="e.g., $20 / Free / Sliding scale"
            required
          />
          <TextAreaField
            form={form}
            name={"description"}
            label="Short performance description"
            required
            rows={4}
          />
           <InviteRecipientEmailsSection
            form={form}
            title={INVITE_PARTICIPATING_ARTISTS_TITLE}
            description={INVITE_PARTICIPATING_ARTISTS_DESCRIPTION}
          />
        </>
      ) : (
        <>
          <TextField form={form} name={"title"} label="Performance title" required />
          <TextField form={form} name={"organizer"} label="Company or artist name" required />
          <TextField form={form} name={"website"} label="Company or artist website" type="url" placeholder="https://..." />
          <TextField
            form={form}
            name={"link"}
            label="Ticket link"
            type="url"
            placeholder="https://..."
            required
          />
          <TextField
            form={form}
            name={"price"}
            label="Ticket price"
            placeholder="e.g., $20 / Free / Sliding scale"
            required
          />
          <TextAreaField
            form={form}
            name={"description"}
            label="Short performance description"
            required
            rows={4}
          />
        </>
      )}
    </Section>
  )
}
