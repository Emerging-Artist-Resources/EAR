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
import { useSyncArtistTypeFromProfile } from "@/hooks/use-sync-artist-type-from-profile"

interface ClassesWorkshopsStepProps {
  form: UseFormReturn<EventFormData>
}

export function ClassesWorkshopsStep({ form }: ClassesWorkshopsStepProps) {
  useSyncArtistTypeFromProfile(form, "artistType")

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

  const isWorkshop = classWorkshopType === "WORKSHOP"
  const isClass = classWorkshopType === "CLASS"
  const isPart = isPartOfFestivalOrWorkshop === "YES"
  const shouldUseParentDates = isClass && isPart

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
    if (prev === "CLASS" && classWorkshopType === "WORKSHOP") {
      form.setValue("isPartOfFestivalOrWorkshop", "NO")
      form.setValue("parentEventId", "")
      form.setValue("placeholderTitle", "")
      form.setValue("placeholderOrganizerName", "")
      form.setValue("placeholderContactEmail", "")
      form.setValue("placeholderWebsiteOrSocial", "")
      form.setValue("placeholderStartDate", "")
      form.setValue("placeholderEndDate", "")
      form.clearErrors([
        "isPartOfFestivalOrWorkshop",
        "parentEventId",
        "placeholderTitle",
        "placeholderOrganizerName",
        "placeholderContactEmail",
        "placeholderWebsiteOrSocial",
        "placeholderStartDate",
        "placeholderEndDate",
      ] as unknown as never)
    }
  }, [classWorkshopType, form.setValue, form.clearErrors])

  useEffect(() => {
    if (!isWorkshop) return
    if (dropInClassesAvailable === "NO") {
      form.setValue("dropInClasses", "")
      form.clearErrors("dropInClasses" as unknown as never)
    }
  }, [isWorkshop, dropInClassesAvailable, form.setValue, form.clearErrors])

  const locationConfig = {
    addressName: "address",
    venueName: "venueName",
    placeIdName: "placeId",
    latName: "lat",
    lngName: "lng",
    instructionsName: "locationInstructions",
    instructionsPlaceholder: "",
    label: "Location",
    required: true,
  } as const

  return (
    <>
      <Section title="Entry Selection">
        <SelectBlock
          form={form}
          name={"classWorkshopType"}
          label="What are you submitting?"
          required
          options={[
            { label: "Class (single, recurring, multiple dates, or part of a workshop)", value: "CLASS" },
            { label: "Workshop", value: "WORKSHOP" },
          ]}
        />
      </Section>

      {isClass && (
        <>
          <Section title="Basic Info" description="Class (single or multiple dates)">
            <TextField form={form} name={"title"} label="Class Name" required />
            <TextField
              form={form}
              name={"organizer"}
              label="Company / Instructor(s)"
              placeholder="Name of the company or individual(s) leading the class."
              required
            />
            <TextAreaField
              form={form}
              name={"description"}
              label="Class Description"
              required
              rows={4}
            />
            <TextField
              form={form}
              name={"price"}
              label="Price"
              required
              placeholder="e.g., $30, Free, $20–40 sliding scale"
            />
            <TextField form={form} name={"classWorkshopDuration"} label="Class Duration" required />
            <TextAreaField
              form={form}
              name={"classRegistrationDetails"}
              label="Registration Link & Instructions"
              placeholder="Provide a link and/or sign-up instructions."
              required
              rows={3}
            />
            <ListingWebsiteField
              form={form}
              note="Link to your company or project."
            />
          </Section>

          <Section title="Festival / Workshop Association">
            <SelectBlock
              form={form}
              name={"isPartOfFestivalOrWorkshop"}
              label="Is this class part of a festival or workshop?"
              required
              options={[
                { label: "No", value: "NO" },
                { label: "Yes", value: "YES" },
              ]}
            />
          </Section>

          <FestivalAssociationSection form={form} isPartOfFestival={isPart} />

          {shouldUseParentDates ? (
            <ClassOccurrencesPicker form={form} label="Class Schedule" showEndTime />
          ) : (
            <Section title="Schedule">
              <ShowtimesList
                form={form as unknown as UseFormReturn<Record<string, unknown>>}
                name={"occurrences"}
                title="Class Dates & Times"
                note="Add all dates and start times."
                required
                rowLabel="Class date"
                maxTimesPerDate={1}
                showEndTime
                locationConfig={locationConfig}
              />
            </Section>
          )}
        </>
      )}

      {isWorkshop && (
        <>
          <Section title="Basic Info" description="Multi-day workshop">
            <TextField form={form} name={"title"} label="Workshop Name" required />
            <TextField form={form} name={"organizer"} label="Hosting Company / Individual(s)" required />
            <TextAreaField
              form={form}
              name={"description"}
              label="Short Workshop Description"
              required
              rows={4}
            />
            <TextField form={form} name={"classWorkshopDuration"} label="Workshop Duration" required />
            <TextField form={form} name={"price"} label="Price" required placeholder="e.g., $30, Free, $20–40 sliding scale" />
            <TextAreaField
              form={form}
              name={"classRegistrationDetails"}
              label="Registration Link & Instructions"
              placeholder="Provide a link and/or sign-up instructions."
              required
              rows={3}
            />
            <ListingWebsiteField form={form} note="Optional" />
          </Section>

          <Section title="Workshop Details">
            <TextAreaField
              form={form}
              name={"workshopDetails"}
              label="Details"
              placeholder="What will participants learn or explore? Who is this workshop for? Are there any recommended experience, training, or preparation?"
              rows={5}
            />
            <TextAreaField
              form={form}
              name={"classesOffered"}
              label="Workshop Schedule"
              placeholder="Provide a list of all classes or sessions included in the workshop, along with the instructors and brief descriptions."
              rows={6}
            />
            <SelectBlock
              form={form}
              name={"dropInClassesAvailable"}
              label="Drop-in Availability"
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
                label="Drop-in Pricing"
                placeholder="Provide details and pricing if applicable."
                rows={4}
              />
            )}
          </Section>

          <Section title="Schedule">
            <ShowtimesList
              form={form as unknown as UseFormReturn<Record<string, unknown>>}
              name={"occurrences"}
              title="Workshop Dates & Times"
              note="Add all known dates and start times."
              required
              rowLabel="Workshop date"
              maxTimesPerDate={1}
              showEndTime
              locationConfig={locationConfig}
            />
          </Section>

          <ShareListingSection form={form} />
        </>
      )}
    </>
  )
}
