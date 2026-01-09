"use client"

import { UseFormReturn, useFieldArray, Path, useWatch } from "react-hook-form"
import { useEffect } from "react"

import { EventFormData } from "@/lib/validations/events"
import { OrganizerDatesTimes } from "@/components/event-forms/event-wizard/steps/performance/OrganizerDatesTimes"

import { Section } from "@/components/forms/blocks/Section"
import { Button } from "@/components/ui/button"
import { PieceDetails } from "@/components/forms/blocks/PieceDetails"
import { SelectBlock } from "@/components/forms/blocks/Select"
import { ListingFeeSection } from "./ListingFeeSection"
import { OrganizerMediaSocials } from "./OrganizerMediaSocials"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"

export function OrganizerMultiProgramForm({ form }: { form: UseFormReturn<EventFormData> }) {
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "pieces" as never,
  })

  const addPieceChoice = useWatch({
    control: form.control,
    name: "addPiece" as Path<EventFormData>,
  }) as string | boolean | undefined
  const wantsToAddPiece = addPieceChoice === "true" || addPieceChoice === true

  useEffect(() => {
    if (wantsToAddPiece && fields.length === 0) {
      append({
        title: "",
        creatorName: "",
        creatorEmail: "",
      } as never)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsToAddPiece, fields.length])

  return (
    <>
      <OrganizerDatesTimes form={form} />
      

      <Section title="Performance Pieces">
        <SelectBlock
          form={form}
          name={"addPiece" as Path<EventFormData>}
          label=" Are you presenting work in your own festival "
          required
          options={[
            { label: "Yes, I'm presenting work in my own festival", value: "true" },
            { label: "No, I am not presenting work in my own festival", value: "false" },
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
                onClick={() =>
                  append({
                    title: "",
                    creatorName: "",
                    creatorEmail: "",
                  } as never)
                }
              >
                + Add Another Piece
              </Button>
              <span className="text-sm text-gray-600">
                {fields.length} {fields.length === 1 ? "piece" : "pieces"} added
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-gray-900 mb-2">Shareable link</p>
            <p className="text-sm text-gray-600 mb-3">
              A shareable link will be provided after your event is approved. You can send this link to other artists to submit their pieces.
            </p>
            <p className="text-xs text-gray-500">
              (Link will be available after approval)
            </p>
          </div>
        </div>
      </Section>

    </>
  )
}
