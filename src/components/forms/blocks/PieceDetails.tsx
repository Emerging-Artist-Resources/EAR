"use client"

import { UseFormReturn, Path } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { TextField } from "@/components/forms/blocks/TextField"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { PhotoUploader } from "@/components/forms/blocks/PhotoUploader"
import { PieceOccurrencesPicker } from "@/components/forms/blocks/PieceOccurrencesPicker"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface PieceDetailsProps {
  form: UseFormReturn<EventFormData>
  index: number
  canRemove: boolean
  onRemove: () => void
  showOccurrences?: boolean
  occurrencesMode?: "SELECT_FROM_EVENT" | "SELECT_FROM_PARENT" | "CUSTOM_ONLY"
}

export function PieceDetails({
  form,
  index,
  canRemove,
  onRemove,
  showOccurrences = true,
  occurrencesMode = "SELECT_FROM_EVENT",
}: PieceDetailsProps) {
  const prefix = index === 0 ? "piece" : `pieces.${index}`

  return (
    <Card className="p-4 border-2 border-gray-200">
      <div className="flex items-center justify-between mb-4">
        
        {canRemove && (
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
          />
        )}

        <TextField
          form={form}
          name={`${prefix}_title` as Path<EventFormData>}
          label="Piece title"
          required
        />

        <TextField
          form={form}
          name={`${prefix}_choreographer` as Path<EventFormData>}
          label="Choreographer / creator"
          required
        />

        <TextField
          form={form}
          name={`${prefix}_company` as Path<EventFormData>}
          label="Company / artist name (optional)"
        />

        <TextAreaField
          form={form}
          name={`${prefix}_description` as Path<EventFormData>}
          label="Description"
          required
          rows={4}
        />

        <TextAreaField
          form={form}
          name={`${prefix}_credits` as Path<EventFormData>}
          label="Credits / performers"
          required
          placeholder="Performers, collaborators, composer, designers..."
          rows={4}
        />

        <TextField
          form={form}
          name={`${prefix}_social_handles` as Path<EventFormData>}
          label="Social handles"
          placeholder="@..."
          required
        />

        <PhotoUploader
          form={form}
          name={`${prefix}_promoFiles` as Path<EventFormData>}
          label="Piece images"
          description="Upload up to 5 images"
        />

        <TextAreaField
          form={form}
          name={`${prefix}_photo_credits` as Path<EventFormData>}
          label="Image captions / photo credits"
          placeholder="Photo by..."
          rows={3}
        />

        <TextAreaField
          form={form}
          name={`${prefix}_additional_info` as Path<EventFormData>}
          label="Anything else? (optional)"
          rows={4}
        />
      </div>
    </Card>
  )
}

