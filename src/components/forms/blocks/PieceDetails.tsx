"use client"

import { UseFormReturn, Path } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { TextField } from "@/components/forms/blocks/TextField"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { PieceOccurrencesPicker } from "@/components/forms/blocks/PieceOccurrencesPicker"
import { Button } from "@/components/ui/button"

interface PieceDetailsProps {
  form: UseFormReturn<EventFormData>
  index: number
  canRemove: boolean
  onRemove: () => void
  showOccurrences?: boolean
  occurrencesMode?: "SELECT_FROM_EVENT" | "SELECT_FROM_PARENT" | "CUSTOM_ONLY"
  enableSampleData?: boolean
}

export function PieceDetails({
  form,
  index,
  canRemove,
  onRemove,
  showOccurrences = true,
  occurrencesMode = "SELECT_FROM_EVENT",
  enableSampleData = false,
}: PieceDetailsProps) {
  const prefix = index === 0 ? "piece" : `pieces.${index}`

  return (
    <>
      <div className="flex items-center justify-between">
        
        {canRemove && index > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="text-red-600 hover:text-red-700"
          >
            Remove
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {showOccurrences && (
          <PieceOccurrencesPicker
            form={form}
            label="Which event date(s)/time(s) is this piece in?"
            mode={occurrencesMode}
            enableSampleData={enableSampleData}
          />
        )}

        <TextField
          form={form}
          name={`${prefix}_company` as Path<EventFormData>}
          label="Company / Artist Name"
          required
        />

        <TextField
          form={form}
          name={`${prefix}_companyWebsite` as Path<EventFormData>}
          label="Company / Artist Website"
          type="url"
          placeholder="https://..."
        />

        <TextField
          form={form}
          name={`${prefix}_title` as Path<EventFormData>}
          label="Piece Title"
          required
        />

        <TextField
          form={form}
          name={`${prefix}_choreographer` as Path<EventFormData>}
          label="Choreographer / Creator (if different from company / artist name)"
        />

        <TextAreaField
          form={form}
          name={`${prefix}_description` as Path<EventFormData>}
          label="Piece Description"
          required
          rows={4}
        />

        <TextAreaField
          form={form}
          name={`${prefix}_credits` as Path<EventFormData>}
          label="Credits / Performers"
          required
          placeholder="Performers, collaborators, composer, designers..."
          rows={4}
        />

      </div>
    </>
  )
}

