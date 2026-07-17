"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"

import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { PieceOccurrencesPicker } from "@/components/forms/blocks/PieceOccurrencesPicker"
import { PieceDetails } from "@/components/forms/blocks/PieceDetails"
import { EventSearch } from "@/components/forms/blocks/EventSearch"
import { InviteRecipientEmailsSection } from "@/components/event-forms/event-wizard/steps/performance/InviteRecipientEmailsSection"
import { FormFieldTooltip } from "@/components/forms/blocks/FormFieldTooltip"
import { resetPieceParentToSearch, clearPieceParentDependentSchedule } from "@/components/event-forms/event-wizard/steps/performance/reset-piece-parent-to-search"

const MANUAL_LINK_TOOLTIP =
  "Once the organizer submits their event to EAR, your work will be linked to their listing."

const INVITE_ORGANIZER_TITLE = "Invite the organizer or presenter"
const INVITE_ORGANIZER_DESCRIPTION =
  "Enter the email address(es) of the organizer, presenter, or collaborators. Once your listing has been approved, we'll notify them and invite them to create connected listings for the event."

export function PieceSubmissionFlow({ form }: { form: UseFormReturn<EventFormData> }) {
  const parentEventMode = useWatch({
    control: form.control,
    name: "parentEventMode" as Path<EventFormData>,
    defaultValue: "SELECT",
  }) as "SELECT" | "MANUAL" | undefined

  const parentEventId = useWatch({
    control: form.control,
    name: "parentEventId" as Path<EventFormData>,
  }) as string | undefined

  return (
    <>
      <Section title="Search for EAR event">
        {parentEventMode !== "MANUAL" && (
          <EventSearch
            form={form}
            eventType="PERFORMANCE"
            eventIdField={"parentEventId" as Path<EventFormData>}
            eventModeField={"parentEventMode" as Path<EventFormData>}
            label="Search for event"
            placeholder="Type to search for event..."
            showCantLocateButton={true}
            cantLocateButtonLabel="Event not listed with EAR? Enter manually."
            cantLocateTooltip={MANUAL_LINK_TOOLTIP}
            onParentIdChange={() => clearPieceParentDependentSchedule(form)}
            required={true}
          />
        )}
      </Section>

      {parentEventMode === "MANUAL" && (
        <Section title="Event not listed with EAR? Enter manually.">
          <p className="text-sm text-muted-foreground mb-3 flex flex-wrap items-center gap-2">
            <span>Provide what you know so we can link your listing later.</span>
            <FormFieldTooltip text={MANUAL_LINK_TOOLTIP} />
          </p>
          <TextField form={form} name={"parentEventName" as Path<EventFormData>} label="Event title" required />
          <TextField form={form} name={"organizer"} label="Organizer name" />
          <TextField
            form={form}
            name={"parentEventContactEmail" as Path<EventFormData>}
            label="Organizer email"
            type="email"
            placeholder="contact@..."
          />
          <TextField
            form={form}
            name={"parentEventWebsite" as Path<EventFormData>}
            label="Website / social"
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
          <button
            type="button"
            className="mt-2 text-sm underline"
            onClick={() => resetPieceParentToSearch(form)}
          >
            Back to search
          </button>
        </Section>
      )}

      <InviteRecipientEmailsSection
        form={form}
        title={INVITE_ORGANIZER_TITLE}
        description={INVITE_ORGANIZER_DESCRIPTION}
      />

      <Section title="Details">
        <PieceDetails
          form={form}
          index={0}
          canRemove={false}
          onRemove={() => {}}
          showOccurrences={false}
          occurrencesMode="CUSTOM_ONLY"
        />
      </Section>

      <Section title="Performance schedule">
        <PieceOccurrencesPicker
          form={form}
          label="Select performance date(s) & time(s)"
          mode={parentEventId ? "SELECT_FROM_PARENT" : "CUSTOM_ONLY"}
        />
      </Section>
    </>
  )
}
