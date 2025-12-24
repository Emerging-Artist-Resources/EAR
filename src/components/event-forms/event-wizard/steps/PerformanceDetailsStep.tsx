"use client"

import { UseFormReturn, Path } from "react-hook-form"
import { useEffect, useMemo, useState } from "react"

import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { DateTimeList } from "@/components/forms/blocks/DateTimeList"
import { LocationField } from "@/components/forms/blocks/LocationField"
import { PhotoUploader } from "@/components/forms/blocks/PhotoUploader"
import { SelectBlock } from "@/components/forms/blocks/Select"
import { PieceDetails } from "@/components/forms/blocks/PieceDetails"
import { PieceOccurrencesPicker } from "@/components/forms/blocks/PieceOccurrencesPicker"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/typography"

interface PerformanceDetailsStepProps {
  form: UseFormReturn<EventFormData>
}

type PerfType = "ORGANIZER" | "PIECE"

// Suggestion: make this boolean in your schema
// addPiece: boolean
export function PerformanceDetailsStep({ form }: PerformanceDetailsStepProps) {
  const perfType = form.watch("type") as PerfType | undefined
  const isOrganizer = perfType === "ORGANIZER"
  const isPiece = perfType === "PIECE"

  const addPieceRaw = form.watch("addPiece" as Path<EventFormData>)
  const addPiece = typeof addPieceRaw === "string" ? addPieceRaw === "true" : addPieceRaw === true

  const [pieceCount, setPieceCount] = useState(addPiece ? 1 : 0)

  const parentEventMode = (form.watch("parentEventMode" as Path<EventFormData>) as
    | "SELECT"
    | "MANUAL"
    | undefined) ?? "SELECT"

  const parentEventId = form.watch("parentEventId" as Path<EventFormData>) as string | undefined

  useEffect(() => {
    if (addPiece && pieceCount === 0) {
      setPieceCount(1)
    } else if (!addPiece && pieceCount > 0) {
      setPieceCount(0)
    }
  }, [addPiece, pieceCount])

  // Reset only when the branch changes
  useEffect(() => {
    if (perfType === "ORGANIZER") {
      // Clear piece-only linkage fields
      form.setValue("parentEventId" as Path<EventFormData>, "" as unknown as never)
      form.setValue("parentEventMode" as Path<EventFormData>, "SELECT" as unknown as never)
      form.clearErrors(["parentEventId", "parentEventMode"] as unknown as never)
    }

    if (perfType === "PIECE") {
      // Clear organizer-only fields (optional: only if you really want to)
      form.setValue("parentEventName" as Path<EventFormData>, "" as unknown as never)
      form.clearErrors(["parentEventName"] as unknown as never)
    }
  }, [perfType, form])

  // Clear listing fee fields when artist type changes
  const artistType = form.watch("artistType" as Path<EventFormData>) as "ESTABLISHED" | "EMERGING" | undefined
  useEffect(() => {
    if (artistType === "ESTABLISHED") {
      // Clear emerging artist-specific fields
      form.setValue("listingFeeOption" as Path<EventFormData>, undefined as unknown as never)
      form.setValue("listingFeeExplanation" as Path<EventFormData>, "" as unknown as never)
      form.setValue("complementaryTicketInfo" as Path<EventFormData>, "" as unknown as never)
      form.clearErrors(["listingFeeOption", "listingFeeExplanation", "complementaryTicketInfo"] as unknown as never)
    }
  }, [artistType, form])

  // Clear conditional fields when listing fee option changes
  const listingFeeOption = form.watch("listingFeeOption" as Path<EventFormData>) as
    | "PAY_FEE"
    | "PROVIDE_TICKET"
    | "EXPLAIN"
    | undefined
  useEffect(() => {
    if (listingFeeOption !== "PROVIDE_TICKET") {
      form.setValue("complementaryTicketInfo" as Path<EventFormData>, "" as unknown as never)
      form.clearErrors(["complementaryTicketInfo"] as unknown as never)
    }
    if (listingFeeOption !== "EXPLAIN") {
      form.setValue("listingFeeExplanation" as Path<EventFormData>, "" as unknown as never)
      form.clearErrors(["listingFeeExplanation"] as unknown as never)
    }
  }, [listingFeeOption, form])

  const submitTypeOptions = useMemo(
    () => [
      { label: "I’m submitting an event (I’m an organizer/producer)", value: "ORGANIZER" },
      { label: "I’m submitting a piece that’s part of an event/festival", value: "PIECE" },
    ],
    []
  )

  return (
    <Section title="Performance submission">
      <SelectBlock
        form={form}
        name={"type"}
        label="What are you submitting?"
        required
        options={submitTypeOptions}
      />

      {isOrganizer && (
        <>
          <Section title="Event basics">
            <TextField form={form} name={"event_title"} label="Title" required />
            <TextField form={form} name={"event_organizer"} label="Organizer / presenting company" required />
            <TextField form={form} name={"event_contact_email"} label="Contact email" type="email" required />

            <TextField form={form} name={"event_website"} label="Website" type="url" placeholder="https://..." />
            <TextField
              form={form}
              name={"event_ticket_link"}
              label="Ticket link"
              type="url"
              placeholder="https://..."
              required
            />
            <TextField form={form} name={"event_cost"} label="Ticket cost" placeholder="e.g., $20 / Free / Sliding scale" required />

            <TextAreaField
              form={form}
              name={"event_description"}
              label="Short description"
              required
              placeholder="1–3 sentences. What is this program?"
              rows={4}
            />

            <LocationField
              form={form}
              addressName={"event_address"}
              venueName={"event_venueName"}
              placeIdName={"event_placeId"}
              latName={"event_lat"}
              lngName={"event_lng"}
            />
          </Section>

          <Section title="Artist Credits (optional)">
            <TextAreaField form={form} name={"event_participants"} label="Please list the names of the artists performing in this event (choreographers, piece titles, etc.)" placeholder="Artist name(s)" />
          </Section>

          <Section title="Dates & times">
            <DateTimeList
              form={form as unknown as UseFormReturn<Record<string, unknown>>}
              name={"extraOccurrences"}
              title="Event dates and times"
              required
            />
          </Section>

          <Section title="Images & socials">
            <PhotoUploader
              form={form}
              name={"event_promoFiles"}
              label="Promotional images"
              description="Upload up to 5 images"
            />
            <TextAreaField
              form={form}
              name={"event_photo_credits"}
              label="Image captions / photo credits"
              placeholder="Photo by..., dancers:..., piece:..."
              rows={3}
            />
            <TextField form={form} name={"event_social_handles"} label="Social handles" placeholder="@..." required/>
          </Section>

          

          <Section title="Pieces">
            <SelectBlock
              form={form}
              name={"addPiece" as Path<EventFormData>}
              label="Do you want to add pieces to this event?"
              required
              options={[
                { label: "Yes, add pieces", value: "true" },
                { label: "No, I'm done", value: "false" },
              ]}
            />
          </Section>

          {pieceCount > 0 && (
            <Section title="Piece details">
              <div className="space-y-6">
                {Array.from({ length: pieceCount }).map((_, index) => (
                  <PieceDetails
                    key={index}
                    form={form}
                    index={index}
                    canRemove={pieceCount > 1}
                    onRemove={() => setPieceCount((prev) => Math.max(1, prev - 1))}
                    showOccurrences={true}
                    occurrencesMode="SELECT_FROM_EVENT"
                  />
                ))}

                <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPieceCount((prev) => prev + 1)}
                  >
                    + Add Another Piece
                  </Button>
                  <span className="text-sm text-gray-600">
                    {pieceCount} {pieceCount === 1 ? "piece" : "pieces"} added
                  </span>
                </div>
              </div>
            </Section>
          )}
        </>
      )}

      {isPiece && (
        <>
          <Section title="Which event is this part of?">
            {/* TODO (future): searchable picker */}
            <TextField
              form={form}
              name={"parentEventId" as Path<EventFormData>}
              label="Event (search/ID for now)"
              required
              placeholder="(temporary) paste event ID or select later"
            />

            <SelectBlock
              form={form}
              name={"parentEventMode" as Path<EventFormData>}
              label="Can't find the event?"
              required
              options={[
                { label: "I can find it / it exists on EAR", value: "SELECT" },
                { label: "I can't find it — I'll enter basic details", value: "MANUAL" },
              ]}
            />
          </Section>

          {parentEventMode === "MANUAL" && (
            <Section title="Basic event info (so we can link it later)">
              <TextField form={form} name={"parentEventName" as Path<EventFormData>} label="Event/festival name" required />
              <TextField form={form} name={"parentEventWebsite" as Path<EventFormData>} label="Website (optional)" type="url" placeholder="https://..." />
              <TextField form={form} name={"parentEventContactEmail" as Path<EventFormData>} label="Contact email (optional)" type="email" placeholder="contact@..." />
            </Section>
          )}

          <Section title="When does your piece perform?">
            {/* NEW: checkboxes from parent event, with fallback to custom */}
            <PieceOccurrencesPicker
              form={form}
              label="Select performance date(s)/time(s)"
              mode={parentEventId ? "SELECT_FROM_PARENT" : "CUSTOM_ONLY"}
            />
          </Section>

          <Section title="Piece details">
            <PieceDetails
              form={form}
              index={0}
              canRemove={false}
              onRemove={() => {}}
              showOccurrences={false}
              occurrencesMode="CUSTOM_ONLY"
            />
          </Section>
        </>
      )}

      <Section title="Listing Fee">
        <SelectBlock
          form={form}
          name={"artistType" as Path<EventFormData>}
          label="Are you an established or emerging artist?"
          required
          options={[
            { label: "Established artist", value: "ESTABLISHED" },
            { label: "Emerging artist", value: "EMERGING" },
          ]}
        />

        {(() => {
          if (artistType === "ESTABLISHED") {
            return (
              <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-md">
                <Text className="text-sm font-medium text-gray-900">Listing Fee: $50</Text>
                <Text className="text-xs text-gray-600 mt-1">
                  As an established artist, your listing fee is $50. Payment will be processed after submission.
                </Text>
              </div>
            )
          }

          if (artistType === "EMERGING") {
            return (
              <div className="mt-4 space-y-4">
                <SelectBlock
                  form={form}
                  name={"listingFeeOption" as Path<EventFormData>}
                  label="How would you like to handle the listing fee?"
                  required
                  options={[
                    { label: "Pay listing fee ($35)", value: "PAY_FEE" },
                    { label: "Provide a complementary ticket", value: "PROVIDE_TICKET" },
                    { label: "Explain why I can't pay the fee or provide a ticket", value: "EXPLAIN" },
                  ]}
                />

                {listingFeeOption === "PROVIDE_TICKET" && (
                  <TextAreaField
                    form={form}
                    name={"complementaryTicketInfo" as Path<EventFormData>}
                    label="Complementary Ticket Information"
                    required
                    placeholder="Please provide details about the complementary ticket (date, time, how to claim, etc.)"
                    rows={4}
                  />
                )}

                {listingFeeOption === "EXPLAIN" && (
                  <TextAreaField
                    form={form}
                    name={"listingFeeExplanation" as Path<EventFormData>}
                    label="Please explain your situation"
                    required
                    placeholder="Please explain why you cannot pay the listing fee or provide a complementary ticket"
                    rows={4}
                  />
                )}

                {listingFeeOption === "PAY_FEE" && (
                  <div className="p-4 bg-primary-50 border border-primary-200 rounded-md">
                    <Text className="text-sm font-medium text-gray-900">Listing Fee: $35</Text>
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
    </Section>

    
  )
}