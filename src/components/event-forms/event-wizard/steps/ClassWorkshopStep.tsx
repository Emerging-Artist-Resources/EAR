"use client"

import { useEffect, useMemo } from "react"
import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { DateTimeList } from "@/components/forms/blocks/DateTimeList"
import { PhotoUploader } from "@/components/forms/blocks/PhotoUploader"
import { SelectBlock } from "@/components/forms/blocks/Select"
import { FestivalAssociationSection } from "./class-workshop/FestivalAssociationSection"
import { ClassWorkshopListingFeeSection } from "./class-workshop/ClassWorkshopListingFeeSection"
import { ClassOccurrencesPicker } from "@/components/forms/blocks/ClassOccurrencesPicker"

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

  const classOccurrences = useWatch({
    control: form.control,
    name: "classOccurrences" as Path<EventFormData>,
  }) as Array<{ date: string; times: Array<{ time: string }> }> | undefined

  const isWorkshop = classWorkshopType === "WORKSHOP"
  const isPart = isPartOfFestivalOrWorkshop === "YES"
  const shouldUseParentDates = !isWorkshop && isPart

  const occurrenceCount = useMemo(() => {
    if (!classOccurrences || !Array.isArray(classOccurrences)) return 0
    return classOccurrences.length
  }, [classOccurrences])

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
          name={"classTitle"}
          label={isWorkshop ? "Workshop Name" : "Class Name"}
          placeholder="e.g., Contemporary Dance Workshop, Intro to Ballet, Hip Hop Class"
          required
        />

        <TextField
          form={form}
          name={"companyIndividualName"}
          label="Company / Individuals"
          required
          placeholder="Name of the company or individual(s) running the class/workshop"
        />

        <TextField
          form={form}
          name={"classPrice"}
          label="Class Price"
          placeholder="e.g., $30, Free, $20-40 sliding scale"
        />

        <TextField
          form={form}
          name={"classLink"}
          label="Registration Link"
          placeholder="Link or signup instructions"
        />

        <TextAreaField
          form={form}
          name={"shortDescription"}
          label="Class Description"
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

          <TextAreaField
            form={form}
            name={"dropInClasses"}
            label="Are drop-in classes available? And if so, how much do they cost?"
            placeholder="Please describe the drop-in classes and their pricing."
            rows={4}
          />
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
        />
      ) : (
        <Section title="Schedule">
          <DateTimeList
            form={form as unknown as UseFormReturn<Record<string, unknown>>}
            name={"classOccurrences"}
            title={isWorkshop ? "Workshop Dates & Times" : "Class Dates & Times"}
            note="Add all known dates and start times."
            required
            maxTimesPerDate={1}
            locationConfig={{
              addressName: "address",
              venueName: "venueName",
              placeIdName: "placeId",
              latName: "lat",
              lngName: "lng",
              instructionsName: "instructions",
              label: "Location",
              required: true,
            }}
          />
        </Section>
      )}

      <Section title="Promo Images">
        <PhotoUploader
          form={form}
          name={"promoFiles"}
          label="Promotional Images"
          description="Images are highly encouraged for marketing! Please upload up to 5 images."
        />
        <TextAreaField
          form={form}
          name={"credits"}
          label="Image Description / Photo Credit"
          placeholder="Describe the images and provide photo credit"
          rows={3}
        />
        <TextField form={form} name={"socialHandles"} label="Social Media Handles" placeholder="@username" />
      </Section>

      <ClassWorkshopListingFeeSection
        form={form}
        isWorkshop={isWorkshop}
        occurrenceCount={occurrenceCount}
      />

      <Section title="Additional Information">
        <TextAreaField
          form={form}
          name={"notes"}
          label="Anything else you'd like us to know?"
          placeholder="Pricing, accessibility, what to bring, etc."
          rows={4}
        />
      </Section>
    </>
  )
}
