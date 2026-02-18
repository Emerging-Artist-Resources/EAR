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
          label="Search for festival/workshop by name"
          placeholder="Start typing the event name…"
          showCantLocateButton={true}
          onCantLocate={() => setShowPlaceholder(true)}
        />
      )}

      {showPlaceholder && (
        <Section title="Basic event info (so we can link it later)">
          <TextField form={form} name={"placeholderTitle"} label="Festival / Workshop Title" required />
          <TextField form={form} name={"placeholderOrganizerName"} label="Organizer Name" />
          <TextField
            form={form}
            name={"placeholderContactEmail"}
            label="Organizer Contact Email"
            placeholder="name@email.com"
          />
          <TextField
            form={form}
            name={"placeholderWebsiteOrSocial"}
            label="Website / Social"
            placeholder="Link or @handle (optional)"
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

