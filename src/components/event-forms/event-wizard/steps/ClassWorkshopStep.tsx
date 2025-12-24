"use client"

import { useEffect, useState, useMemo } from "react"
import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { DateTimeList } from "@/components/forms/blocks/DateTimeList"
import { LocationField } from "@/components/forms/blocks/LocationField"
import { PhotoUploader } from "@/components/forms/blocks/PhotoUploader"
import { SelectBlock } from "@/components/forms/blocks/Select"
import { Text } from "@/components/ui/typography"

interface ClassesWorkshopsStepProps {
  form: UseFormReturn<EventFormData>
}

/**
 * Assumptions:
 * - baseSchema already requires: address, socialHandles, photoUrls, credits
 * - This step uses LocationField for address + instructions
 * - If you have an actual autocomplete component for parent events, swap it in where marked.
 */
export function ClassesWorkshopsStep({ form }: ClassesWorkshopsStepProps) {
  const classWorkshopType = form.watch("classWorkshopType")
  const isWorkshop = classWorkshopType === "WORKSHOP"

  const assoc = form.watch("isPartOfFestivalOrWorkshop")
  const isPart = assoc === "YES"

  const [showPlaceholder, setShowPlaceholder] = useState(false)

  // Watch listing fee fields
  const classArtistType = form.watch("classArtistType" as Path<EventFormData>) as "ESTABLISHED" | "EMERGING" | undefined
  const classListingFeeOption = form.watch("classListingFeeOption" as Path<EventFormData>) as
    | "PAY_FEE"
    | "PROVIDE_GUEST_SPOT"
    | "EXPLAIN"
    | undefined

  // Watch class occurrences to calculate extra fees for multiple dates
  const classOccurrences = useWatch({
    control: form.control,
    name: "classOccurrences" as Path<EventFormData>,
  }) as Array<{ date: string; times: Array<{ time: string }> }> | undefined

  const occurrenceCount = useMemo(() => {
    if (!classOccurrences || !Array.isArray(classOccurrences)) return 0
    return classOccurrences.length
  }, [classOccurrences])

  // Calculate extra fees for CLASS type with multiple dates
  // Base fee + $10 per additional date (first date is included in base)
  const extraFees = useMemo(() => {
    if (isWorkshop || occurrenceCount <= 1) return 0
    return (occurrenceCount - 1) * 10 // $10 per additional date
  }, [isWorkshop, occurrenceCount])

  // Clean up association fields when toggling NO
  useEffect(() => {
    if (!isPart) {
      form.setValue("parentEventId", "")
      form.setValue("placeholderTitle", "")
      form.setValue("placeholderOrganizerName", "")
      form.setValue("placeholderContactEmail", "")
      form.setValue("placeholderWebsiteOrSocial", "")
      form.setValue("placeholderStartDate", "")
      form.setValue("placeholderEndDate", "")
      setShowPlaceholder(false)
      form.clearErrors([
        "parentEventId",
        "placeholderTitle",
        "placeholderOrganizerName",
        "placeholderContactEmail",
        "placeholderStartDate",
        "placeholderEndDate",
      ] as unknown as never)
    }
  }, [isPart, form])

  // Clear listing fee fields when artist type changes
  useEffect(() => {
    if (classArtistType === "ESTABLISHED") {
      form.setValue("classListingFeeOption" as Path<EventFormData>, undefined as unknown as never)
      form.setValue("classListingFeeExplanation" as Path<EventFormData>, "" as unknown as never)
      form.setValue("guestSpotInfo" as Path<EventFormData>, "" as unknown as never)
      form.clearErrors(["classListingFeeOption", "classListingFeeExplanation", "guestSpotInfo"] as unknown as never)
    }
  }, [classArtistType, form])

  // Clear conditional fields when listing fee option changes
  useEffect(() => {
    if (classListingFeeOption !== "PROVIDE_GUEST_SPOT") {
      form.setValue("guestSpotInfo" as Path<EventFormData>, "" as unknown as never)
      form.clearErrors(["guestSpotInfo"] as unknown as never)
    }
    if (classListingFeeOption !== "EXPLAIN") {
      form.setValue("classListingFeeExplanation" as Path<EventFormData>, "" as unknown as never)
      form.clearErrors(["classListingFeeExplanation"] as unknown as never)
    }
  }, [classListingFeeOption, form])

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
          label={isWorkshop ? "Workshop Title" : "Class Title"}
          required
          placeholder={isWorkshop ? "Workshop title" : "Class title"}
        />

        <TextField
          form={form}
          name={"teachers"}
          label={isWorkshop ? "Teacher(s)" : "Teacher(s) / Instructor(s)"}
          required
          placeholder="Name(s)"
        />

        <TextAreaField
          form={form}
          name={"shortDescription"}
          label="Short Description"
          required
          placeholder="1–2 sentences about what people can expect."
          rows={3}
        />

        <TextField
          form={form}
          name={"styleCategory"}
          label="Style / Category"
          placeholder="e.g., Contemporary, Ballet, Hip Hop (optional)"
        />
      </Section>

      <Section title="Promo Images">
      <PhotoUploader form={form} name={"promoFiles"} label="Promo Images" description="Upload up to 5 images" />        <TextAreaField
          form={form}
          name={"credits"}
          label="Image Credits"
          placeholder="Photo credit, image descriptions, etc."
          rows={3}
        />
        <TextField form={form} name={"socialHandles"} label="Social Media Handles" required placeholder="@username" />
      </Section>

      <Section title="Schedule">
        <DateTimeList
          form={form as unknown as UseFormReturn<Record<string, unknown>>}
          name={"classOccurrences"}
          title={isWorkshop ? "Workshop Dates & Times" : "Class Dates & Times"}
          note="Add all known dates. You can add multiple times for a date if needed."
          
          required
        />
      </Section>

      <Section title="Location">
        <LocationField
          form={form}
          addressName={"address"}
          venueName={"venueName"}
          placeIdName={"placeId"}
          latName={"lat"}
          lngName={"lng"}
        />
      </Section>

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

          {isPart && (
            <>
              {!showPlaceholder && (
                <>
                  {/* Swap this for your actual autocomplete block when you paste it */}
                  <TextField
                    form={form}
                    name={"parentEventId"}
                    label="Search for festival/workshop by name"
                    placeholder="Start typing the event name…"
                  />

                  <button
                    type="button"
                    className="mt-2 text-sm underline"
                    onClick={() => setShowPlaceholder(true)}
                  >
                    Can’t find it? Create a placeholder event
                  </button>
                </>
              )}

              {showPlaceholder && (
                <>
                  <TextField form={form} name={"placeholderTitle"} label="Festival / Workshop Title" required />
                  <TextField form={form} name={"placeholderOrganizerName"} label="Organizer Name" required />
                  <TextField
                    form={form}
                    name={"placeholderContactEmail"}
                    label="Contact Email"
                    required
                    placeholder="name@email.com"
                  />
                  <TextField
                    form={form}
                    name={"placeholderWebsiteOrSocial"}
                    label="Website / Social"
                    placeholder="Link or @handle (optional)"
                  />

                  {/* If you have a date-range block, swap these out */}
                  <TextField form={form} name={"placeholderStartDate"} label="Start Date" required placeholder="YYYY-MM-DD" />
                  <TextField form={form} name={"placeholderEndDate"} label="End Date" required placeholder="YYYY-MM-DD" />

                  <button
                    type="button"
                    className="mt-2 text-sm underline"
                    onClick={() => setShowPlaceholder(false)}
                  >
                    Back to search
                  </button>
                </>
              )}
            </>
          )}
        </Section>
      )}

      {isWorkshop && (
        <Section title="Workshop Details">
          <TextAreaField
            form={form}
            name={"workshopDetails"}
            label="Details"
            placeholder="Focus, who it’s for, prerequisites (optional)."
            rows={4}
          />
          <TextAreaField
            form={form}
            name={"classesOffered"}
            label="Classes Offered"
            placeholder="List sessions/classes included (optional)."
            rows={4}
          />
        </Section>
      )}

      <Section title="Listing Fee">
        <SelectBlock
          form={form}
          name={"classArtistType" as Path<EventFormData>}
          label="Are you an established or emerging artist?"
          required
          options={[
            { label: "Established artist", value: "ESTABLISHED" },
            { label: "Emerging artist", value: "EMERGING" },
          ]}
        />

        {(() => {
          if (classArtistType === "ESTABLISHED") {
            const totalFee = 50 + extraFees
            return (
              <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-md">
                <Text className="text-sm font-medium text-gray-900">
                  Listing Fee: ${totalFee}
                  {extraFees > 0 && (
                    <span className="text-xs font-normal text-gray-600 ml-2">
                      ($50 base + ${extraFees} for {occurrenceCount - 1} additional date{occurrenceCount - 1 !== 1 ? "s" : ""})
                    </span>
                  )}
                </Text>
                <Text className="text-xs text-gray-600 mt-1">
                  As an established artist, your base listing fee is $50.
                  {extraFees > 0 && (
                    <>
                      {" "}Additional fees apply for multiple class dates ($10 per additional date).
                    </>
                  )}
                  {" "}Payment will be processed after submission.
                </Text>
              </div>
            )
          }

          if (classArtistType === "EMERGING") {
            const baseFee = 35
            const totalFee = baseFee + extraFees
            return (
              <div className="mt-4 space-y-4">
                <SelectBlock
                  form={form}
                  name={"classListingFeeOption" as Path<EventFormData>}
                  label="How would you like to handle the listing fee?"
                  required
                  options={[
                    { label: `Pay listing fee ($${totalFee}${extraFees > 0 ? ` = $${baseFee} base + $${extraFees} for ${occurrenceCount - 1} additional date${occurrenceCount - 1 !== 1 ? "s" : ""}` : ""})`, value: "PAY_FEE" },
                    { label: "Provide a guest spot", value: "PROVIDE_GUEST_SPOT" },
                    { label: "Explain why I can't pay the fee or provide a guest spot", value: "EXPLAIN" },
                  ]}
                />

                {classListingFeeOption === "PROVIDE_GUEST_SPOT" && (
                  <TextAreaField
                    form={form}
                    name={"guestSpotInfo" as Path<EventFormData>}
                    label="Guest Spot Information"
                    required
                    placeholder="Please provide details about the guest spot (date, time, how to claim, etc.)"
                    rows={4}
                  />
                )}

                {classListingFeeOption === "EXPLAIN" && (
                  <TextAreaField
                    form={form}
                    name={"classListingFeeExplanation" as Path<EventFormData>}
                    label="Please explain your situation"
                    required
                    placeholder="Please explain why you cannot pay the listing fee or provide a guest spot"
                    rows={4}
                  />
                )}

                {classListingFeeOption === "PAY_FEE" && (
                  <div className="p-4 bg-primary-50 border border-primary-200 rounded-md">
                    <Text className="text-sm font-medium text-gray-900">
                      Listing Fee: ${totalFee}
                      {extraFees > 0 && (
                        <span className="text-xs font-normal text-gray-600 ml-2">
                          (${baseFee} base + ${extraFees} for {occurrenceCount - 1} additional date{occurrenceCount - 1 !== 1 ? "s" : ""})
                        </span>
                      )}
                    </Text>
                    <Text className="text-xs text-gray-600 mt-1">
                      Payment will be processed after submission.
                    </Text>
                  </div>
                )}
              </div>
            )
          }

          return null
        })()}
      </Section>

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
