"use client"

import { useState, useEffect } from "react"
import { UseFormReturn, Path } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { EventSearch } from "@/components/forms/blocks/EventSearch"

interface FestivalAssociationSectionProps {
  form: UseFormReturn<EventFormData>
  isPartOfFestival: boolean
}

export function FestivalAssociationSection({
  form,
  isPartOfFestival,
}: FestivalAssociationSectionProps) {
  const [showPlaceholder, setShowPlaceholder] = useState(false)

  useEffect(() => {
    if (!isPartOfFestival) {
      setShowPlaceholder(false)
    }
  }, [isPartOfFestival])

  if (!isPartOfFestival) {
    return null
  }

  return (
    <>
      {!showPlaceholder && (
        <EventSearch
          form={form}
          eventType="CLASS"
          eventIdField={"parentEventId" as Path<EventFormData>}
          eventModeField={"parentEventMode" as Path<EventFormData>}
          label="Search for EAR event"
          placeholder="Start typing the event title..."
          showCantLocateButton={true}
          cantLocateButtonLabel="Event not listed with EAR? Enter manually."
          onCantLocate={() => setShowPlaceholder(true)}
        />
      )}

      {showPlaceholder && (
        <Section title="Enter event manually">
          <TextField form={form} name={"placeholderTitle"} label="Event title" required />
          <TextField form={form} name={"placeholderOrganizerName"} label="Organizer name" required />
          <TextField
            form={form}
            name={"placeholderContactEmail"}
            label="Organizer email"
            placeholder="name@email.com"
            required
          />
          <TextField
            form={form}
            name={"placeholderWebsiteOrSocial"}
            label="Website or social"
            placeholder="Link or @handle"
          />
          <TextField
            form={form}
            name={"placeholderStartDate"}
            label="Event start date"
            type="date"
            required
          />
          <TextField
            form={form}
            name={"placeholderEndDate"}
            label="Event end date"
            type="date"
            required
          />

          <button
            type="button"
            className="mt-2 text-sm underline"
            onClick={() => setShowPlaceholder(false)}
          >
            Back to search
          </button>
        </Section>
      )}
    </>
  )
}
