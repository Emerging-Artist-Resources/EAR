"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"

import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { PieceOccurrencesPicker } from "@/components/forms/blocks/PieceOccurrencesPicker"
import { PieceDetails } from "@/components/forms/blocks/PieceDetails"
import { EventSearch } from "@/components/forms/blocks/EventSearch"
import { InviteRecipientEmailsSection } from "@/components/event-forms/event-wizard/steps/performance/InviteRecipientEmailsSection"
import { form } from "@/lib/spacing"

const MANUAL_LINK_TOOLTIP =
  "Once the organizer submits their event to EAR, your work will be linked to their listing."

const INVITE_ORGANIZER_TITLE = "Invite the organizer or presenter"
const INVITE_ORGANIZER_DESCRIPTION =
  "Enter the email address(es) of the organizer, presenter, or collaborators. Once your listing has been approved, we'll notify them and invite them to create connected listings for the event."

export function PieceSubmissionFlow({ form: eventForm }: { form: UseFormReturn<EventFormData> }) {
  const parentEventMode = useWatch({
    control: eventForm.control,
    name: "parentEventMode" as Path<EventFormData>,
    defaultValue: "SELECT",
  }) as "SELECT" | "MANUAL" | undefined

  const parentEventId = useWatch({
    control: eventForm.control,
    name: "parentEventId" as Path<EventFormData>,
  }) as string | undefined

  return (
    <div className={form.step}>
      {parentEventMode !== "MANUAL" && (
        <Section title="Search for EAR event">
          <EventSearch
            form={eventForm}
            eventType="PERFORMANCE"
            eventIdField={"parentEventId" as Path<EventFormData>}
            eventModeField={"parentEventMode" as Path<EventFormData>}
            showLabel={false}
            placeholder="Type to search for event..."
            showCantLocateButton={true}
            cantLocateButtonLabel="Event not listed with EAR? Enter manually."
            cantLocateTooltip={MANUAL_LINK_TOOLTIP}
            required={true}
          />
        </Section>
      )}

      {parentEventMode === "MANUAL" && (
        <Section
          title="Event not listed with EAR? Enter manually."
          description="Provide what you know so we can link your listing later."
          titleTooltip={MANUAL_LINK_TOOLTIP}
        >
          <TextField form={eventForm} name={"parentEventName" as Path<EventFormData>} label="Event title" required />
          <TextField form={eventForm} name={"organizer"} label="Organizer name" />
          <TextField
            form={eventForm}
            name={"parentEventContactEmail" as Path<EventFormData>}
            label="Organizer email"
            type="email"
            placeholder="contact@..."
          />
          <TextField
            form={eventForm}
            name={"parentEventWebsite" as Path<EventFormData>}
            label="Website / social"
            type="url"
            placeholder="https://..."
          />
          <button
            type="button"
            className="text-sm underline"
            onClick={() => eventForm.setValue("parentEventMode", "SELECT" as unknown as never)}
          >
            Back to search
          </button>
        </Section>
      )}

      <InviteRecipientEmailsSection
        form={eventForm}
        title={INVITE_ORGANIZER_TITLE}
        description={INVITE_ORGANIZER_DESCRIPTION}
      />

      <Section title="Details">
        <PieceDetails
          form={eventForm}
          index={0}
          canRemove={false}
          onRemove={() => {}}
          showOccurrences={false}
          occurrencesMode="CUSTOM_ONLY"
          nestedInSection
        />
      </Section>

      <Section title="Performance schedule">
        <PieceOccurrencesPicker
          form={eventForm}
          label="Select performance date(s) & time(s)"
          mode={parentEventId ? "SELECT_FROM_PARENT" : "CUSTOM_ONLY"}
        />
      </Section>
    </div>
  )
}
