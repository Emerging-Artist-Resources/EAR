"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"

import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { PieceOccurrencesPicker } from "@/components/forms/blocks/PieceOccurrencesPicker"
import { PieceDetails } from "@/components/forms/blocks/PieceDetails"
import { EventSearch } from "@/components/forms/blocks/EventSearch"
import { ListingFeeSection } from "./ListingFeeSection"
import { OrganizerMediaSocials } from "./OrganizerMediaSocials"
import { H2, H3, H4 } from "@/components/ui/typography"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"

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
      <Section title="Find Your Event">
        {parentEventMode !== "MANUAL" && (  
          <EventSearch
            form={form}
            eventType="PERFORMANCE"
            eventIdField={"parentEventId" as Path<EventFormData>}
            eventModeField={"parentEventMode" as Path<EventFormData>}
            label="Search for event"
            placeholder="Type to search for events..."
            showCantLocateButton={true}
            required={true}
          />
        )}
      </Section>

      {parentEventMode === "MANUAL" && (
        <Section title="Basic event info (so we can link it later)">
          <TextField form={form} name={"parentEventName" as Path<EventFormData>} label="Event/festival name" required />
          <TextField
            form={form}
            name={"parentEventWebsite" as Path<EventFormData>}
            label="Website"
            type="url"
            placeholder="https://..."
          />
          <TextField
            form={form}
            name={"parentEventContactEmail" as Path<EventFormData>}
            label="Organizer's Contact Email"
            type="email"
            placeholder="contact@..."
          />
           <button
              type="button"
              className="mt-2 text-sm underline"
              onClick={() => form.setValue("parentEventMode", "SELECT" as unknown as never)}
              >
              Back to search
            </button>
        </Section>
      )}

      <Section title="Piece Details">
        <PieceOccurrencesPicker
          form={form}
          label="Select performance date(s)/time(s)"
          mode={parentEventId ? "SELECT_FROM_PARENT" : "CUSTOM_ONLY"}
        />
      </Section>


        <PieceDetails
          form={form}
          index={0}
          canRemove={false}
          onRemove={() => {}}
          showOccurrences={false}
          occurrencesMode="CUSTOM_ONLY"
        />

        <OrganizerMediaSocials form={form} />
        <Section title="Additional Information">
        <TextAreaField form={form} name={"notes"} label="Anything else you'd like us to know?" placeholder="Additional information" rows={4} />
      </Section>
      <ListingFeeSection form={form} />
    </>
  )
}
