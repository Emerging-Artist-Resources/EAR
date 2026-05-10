"use client"

import { useEffect, useRef } from "react"
import { UseFormReturn, useWatch } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { ShowtimesList } from "@/components/forms/blocks/ShowtimesList"
import { SelectBlock } from "@/components/forms/blocks/Select"
import { FestivalAssociationSection } from "./class-workshop/FestivalAssociationSection"
import { ClassOccurrencesPicker } from "@/components/forms/blocks/ClassOccurrencesPicker"
import { ListingWebsiteField } from "@/components/forms/blocks/ListingWebsiteField"
import { ShareListingSection } from "@/components/event-forms/event-wizard/steps/performance/ShareListingSection"

interface ClassesWorkshopsStepProps {
  form: UseFormReturn<EventFormData>
}

export function ClassesWorkshopsStep({ form }: ClassesWorkshopsStepProps) {
  const classWorkshopType = useWatch({
    control: form.control,
    name: "classWorkshopType",
  }) as "CLASS" | "WORKSHOP" | undefined

  const isPartOfFestivalOrWorkshop = useWatch({
    control: form.control,
    name: "isPartOfFestivalOrWorkshop",
  }) as "YES" | "NO" | undefined

  const dropInClassesAvailable = useWatch({
    control: form.control,
    name: "dropInClassesAvailable",
  }) as "YES" | "NO" | undefined

  // const occurrences = useWatch({
  //   control: form.control,
  //   name: "occurrences" as Path<EventFormData>,
  // }) as Array<{ date: string; times: Array<{ time: string }> }> | undefined

  const isWorkshop = classWorkshopType === "WORKSHOP"
  const isPart = isPartOfFestivalOrWorkshop === "YES"
  const shouldUseParentDates = !isWorkshop && isPart

  // const occurrenceCount = useMemo(() => {
  //   if (!occurrences || !Array.isArray(occurrences)) return 0
  //   return occurrences.length
  // }, [occurrences])

  useEffect(() => {
    if (!isPart) {
      form.setValue("parentEventId", "")
      form.setValue("placeholderTitle", "")
      form.setValue("placeholderOrganizerName", "")
      form.setValue("placeholderContactEmail", "")
      form.setValue("placeholderWebsiteOrSocial", "")
      form.setValue("placeholderStartDate", "")
      form.setValue("placeholderEndDate", "")
      form.clearErrors([
        "parentEventId",
        "placeholderTitle",
        "placeholderOrganizerName",
        "placeholderContactEmail",
        "placeholderStartDate",
        "placeholderEndDate",
      ] as unknown as never)
    }
  }, [isPart, form.setValue, form.clearErrors])

  const prevClassWorkshopTypeRef = useRef(classWorkshopType)
  useEffect(() => {
    const prev = prevClassWorkshopTypeRef.current
    prevClassWorkshopTypeRef.current = classWorkshopType
    if (prev === "WORKSHOP" && classWorkshopType === "CLASS") {
      form.setValue("dropInClassesAvailable", undefined)
      form.setValue("dropInClasses", "")
      form.clearErrors(["dropInClassesAvailable", "dropInClasses"] as unknown as never)
    }
  }, [classWorkshopType, form.setValue, form.clearErrors])

  useEffect(() => {
    if (!isWorkshop) return
    if (dropInClassesAvailable === "NO") {
      form.setValue("dropInClasses", "")
      form.clearErrors("dropInClasses" as unknown as never)
    }
  }, [isWorkshop, dropInClassesAvailable, form.setValue, form.clearErrors])

  return (
    <>
      <Section title="What are you submitting?">
        <SelectBlock
          form={form}
          name={"classWorkshopType"}
          label="Submission Type"
          required
          options={[
            { label: "Class (single or multiple dates)", value: "CLASS" },
            { label: "Multi-day workshop", value: "WORKSHOP" },
          ]}
        />
      </Section>

      <Section title="Basic Info">
        <TextField
          form={form}
          name={"title"}
          label={isWorkshop ? "Workshop Name" : "Class Name"}
          placeholder="e.g., Contemporary Dance Workshop, Intro to Ballet, Hip Hop Class"
          required
        />

        <TextField
          form={form}
          name={"organizer"}
          label="Company / Individuals"
          required
          placeholder="Name of the company or individual(s) running the class/workshop"
        />

        <TextField
          form={form}
          name={"price"}
          label={isWorkshop ? "Workshop Price" : "Class Price"}
          placeholder="e.g., $30, Free, $20-40 sliding scale"
          required //TODO: why was this not required for WORKSHOP?
        />

        <TextField
          form={form}
          name={"classRegistrationDetails"}
          label="Registration link or instructions"
          placeholder="Link or signup instructions"
          required={!isWorkshop}
        />

        <ListingWebsiteField form={form} />

        <TextAreaField
          form={form}
          name={"description"}
          label={isWorkshop ? "Workshop Description" : "Class Description"}
          required
          rows={3}
        />
      </Section>

      {isWorkshop && (
        <Section title="Workshop Details">
          <TextAreaField
            form={form}
            name={"workshopDetails"}
            label="Details"
            placeholder="Focus, who it's for, prerequisites (optional)."
            rows={4}
          />
          <TextAreaField
            form={form}
            name={"classesOffered"}
            label="Classes Offered"
            placeholder="List sessions/classes included (optional)."
            rows={4}
          />

          <SelectBlock
            form={form}
            name={"dropInClassesAvailable"}
            label="Are drop-in classes available?"
            required
            options={[
              { label: "No", value: "NO" },
              { label: "Yes", value: "YES" },
            ]}
          />

          {dropInClassesAvailable === "YES" && (
            <TextAreaField
              form={form}
              name={"dropInClasses"}
              label="How much do they cost? (and any other drop-in details)"
              placeholder="e.g., $25 per class, sliding scale, which sessions allow drop-ins"
              rows={4}
            />
          )}
        </Section>
      )}

      {!isWorkshop && (
        <Section title="Festival or Workshop Association">
          <SelectBlock
            form={form}
            name={"isPartOfFestivalOrWorkshop"}
            label="Is this class part of a festival or multi-day workshop?"
            required
            options={[
              { label: "No", value: "NO" },
              { label: "Yes", value: "YES" },
            ]}
          />
        </Section>
      )}

      {!isWorkshop && <FestivalAssociationSection form={form} isPartOfFestival={isPart} />}

      {shouldUseParentDates ? (
        <ClassOccurrencesPicker
          form={form}
          label={isWorkshop ? "Workshop Schedule" : "Class Schedule"}
          showEndTime
        />
      ) : (
        <Section title="Schedule">
          <ShowtimesList
            form={form as unknown as UseFormReturn<Record<string, unknown>>}
            name={"occurrences"}
            title={isWorkshop ? "Workshop Dates & Times" : "Class Dates & Times"}
            note="Add all known dates and start times."
            required
            rowLabel={isWorkshop ? "Workshop date" : "Class date"}
            maxTimesPerDate={1}
            showEndTime
            locationConfig={{
              addressName: "address",
              venueName: "venueName",
              placeIdName: "placeId",
              latName: "lat",
              lngName: "lng",
              instructionsName: "locationInstructions",
              label: "Location",
              required: true,
            }}
          />
        </Section>
      )}

      {isWorkshop && <ShareListingSection form={form} />}
    </>
  )
}
