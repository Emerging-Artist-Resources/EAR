"use client"

import type { MutableRefObject } from "react"
import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { TextField } from "@/components/forms/blocks/TextField"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { PieceOccurrencesPicker } from "@/components/forms/blocks/PieceOccurrencesPicker"
import { PhotoUploader } from "@/components/forms/blocks/PhotoUploader"
import { PieceExistingImageThumbnails } from "@/components/forms/blocks/PieceExistingImageThumbnails"
import { Button } from "@/components/ui/button"
import { piecePromoFilesFieldName, type OrganizerProgramPiecePhoto } from "@/lib/listings/organizer-program-pieces"

interface PieceDetailsProps {
  form: UseFormReturn<EventFormData>
  index: number
  canRemove: boolean
  onRemove: () => void
  showOccurrences?: boolean
  occurrencesMode?: "SELECT_FROM_EVENT" | "SELECT_FROM_PARENT" | "CUSTOM_ONLY"
  enableSampleData?: boolean
  /** When false, hides choreographer / creator (default piece submission flow). */
  showChoreographerField?: boolean
  showPieceImageUploader?: boolean
  namespacedPieceSchedule?: boolean
  organizerPiecePhotosByIdRef?: MutableRefObject<Record<string, OrganizerProgramPiecePhoto[]>>
}

export function PieceDetails({
  form,
  index,
  canRemove,
  onRemove,
  showOccurrences = true,
  occurrencesMode = "SELECT_FROM_EVENT",
  enableSampleData = false,
  showChoreographerField = false,
  showPieceImageUploader = false,
  namespacedPieceSchedule = false,
  organizerPiecePhotosByIdRef,
}: PieceDetailsProps) {
  const prefix = index === 0 ? "piece" : `pieces.${index}`
  const idField = `${prefix}_id` as Path<EventFormData>
  const promoName = piecePromoFilesFieldName(index)

  const pieceId = useWatch({
    control: form.control,
    name: idField,
  }) as string | undefined

  const existingPaths: string[] =
    pieceId && organizerPiecePhotosByIdRef?.current?.[pieceId]
      ? organizerPiecePhotosByIdRef.current[pieceId].map((p) => p.path).filter(Boolean)
      : []

  return (
    <>
      <input type="hidden" {...form.register(idField)} />

      <div className="flex items-center justify-between">
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
            enableSampleData={enableSampleData}
            scheduleKeyPrefix={namespacedPieceSchedule ? prefix : undefined}
          />
        )}

        <TextField
          form={form}
          name={`${prefix}_company` as Path<EventFormData>}
          label="Company / Artist name"
          required
        />

        <TextField
          form={form}
          name={`${prefix}_companyWebsite` as Path<EventFormData>}
          label="Website"
          type="url"
          placeholder="https://..."
        />

        <TextField
          form={form}
          name={`${prefix}_title` as Path<EventFormData>}
          label="Piece title"
          required
        />

        {showChoreographerField ? (
          <TextField
            form={form}
            name={`${prefix}_choreographer` as Path<EventFormData>}
            label="Choreographer / Creator (if different from company / artist name)"
          />
        ) : null}

        <TextAreaField
          form={form}
          name={`${prefix}_description` as Path<EventFormData>}
          label="Piece description"
          note="Provide a brief description of the work being presented."
          required
          rows={4}
        />

        <TextAreaField
          form={form}
          name={`${prefix}_credits` as Path<EventFormData>}
          label="Artist credits (encouraged)"
          placeholder="Please list all artists and collaborators to be credited for this program. Include names, roles, and associated work titles, if applicable."
          rows={4}
        />

        {showPieceImageUploader ? (
          <div>
            <PieceExistingImageThumbnails paths={existingPaths} />
            <PhotoUploader
              form={form as unknown as UseFormReturn<Record<string, unknown>>}
              name={promoName}
              label="Piece images"
              description="Images specific to this work or program entry (optional, recommended). Upload up to 5 images."
              max={5}
            />
          </div>
        ) : null}
      </div>
    </>
  )
}
