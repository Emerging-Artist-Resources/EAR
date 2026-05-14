"use client"

import { UseFormReturn, useFieldArray, Path, useWatch } from "react-hook-form"
import { useEffect } from "react"

import { EventFormData } from "@/lib/validations/events"
import { OrganizerDatesTimes } from "@/components/event-forms/event-wizard/steps/performance/OrganizerDatesTimes"

import { Section } from "@/components/forms/blocks/Section"
import { Button } from "@/components/ui/button"
import { PieceDetails } from "@/components/forms/blocks/PieceDetails"
import { SelectBlock } from "@/components/forms/blocks/Select"

export function OrganizerMultiProgramForm({ form }: { form: UseFormReturn<EventFormData> }) {
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "pieces" as never,
  })

  const addPieceChoice = useWatch({
    control: form.control,
    name: "addPiece" as Path<EventFormData>,
  }) as string | boolean | undefined
  const wantsToAddPiece = addPieceChoice === "true" || addPieceChoice === true

  useEffect(() => {
    if (!wantsToAddPiece) {
      replace([])
      return
    }
    if (fields.length === 0) {
      append({} as never)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsToAddPiece, fields.length])

  return (
    <>
      <OrganizerDatesTimes form={form} />

      {/* <Section title="Media upload (festival or shared program)">
        <PhotoUploader
          form={form}
          name={"promoFiles"}
          label="Promotional images"
          description="Upload images for this festival or shared program (optional but recommended)."
        />
      </Section> */}

      <Section title="Piece information">
        <SelectBlock
          form={form}
          name={"addPiece" as Path<EventFormData>}
          label="Are you presenting work?"
          required
          options={[
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
        />

        {wantsToAddPiece && (
          <div className="mt-6 space-y-6">
            {fields.map((field, index) => (
              <PieceDetails
                key={field.id}
                form={form}
                index={index}
                canRemove={fields.length > 1}
                onRemove={() => remove(index)}
                showOccurrences={true}
                occurrencesMode="SELECT_FROM_EVENT"
              />
            ))}

            <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => append({} as never)}
              >
                + Add another piece
              </Button>
              <span className="text-sm text-gray-600">
                {fields.length} {fields.length === 1 ? "piece" : "pieces"} added
              </span>
            </div>
          </div>
        )}
      </Section>
    </>
  )
}
