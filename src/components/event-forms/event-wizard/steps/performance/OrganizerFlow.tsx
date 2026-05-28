"use client"

import type { MutableRefObject } from "react"
import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { useSyncArtistTypeFromProfile } from "@/hooks/use-sync-artist-type-from-profile"
import { OrganizerBasics } from "@/components/event-forms/event-wizard/steps/performance/OrganizerBasics"
import { OrganizerSoloForm } from "@/components/event-forms/event-wizard/steps/performance/OrganizerSoloForm"
import { OrganizerMultiProgramForm } from "@/components/event-forms/event-wizard/steps/performance/OrganizerMultiProgramForm"
import type { OrganizerProgramPiecePhoto } from "@/lib/listings/organizer-program-pieces"

type EventType = "SOLO" | "SPLIT_BILL" | "FESTIVAL"

export function OrganizerFlow({
  form,
  organizerPiecePhotosByIdRef,
}: {
  form: UseFormReturn<EventFormData>
  organizerPiecePhotosByIdRef?: MutableRefObject<Record<string, OrganizerProgramPiecePhoto[]>>
}) {
  const eventType = useWatch({
    control: form.control,
    name: "eventType" as Path<EventFormData>,
  }) as EventType | undefined
  const isMulti = eventType === "SPLIT_BILL" || eventType === "FESTIVAL"

  useSyncArtistTypeFromProfile(form, "artistType" as Path<EventFormData>)

  return (
    <>
      <OrganizerBasics form={form} />
      {isMulti ? (
        <OrganizerMultiProgramForm form={form} organizerPiecePhotosByIdRef={organizerPiecePhotosByIdRef} />
      ) : (
        <OrganizerSoloForm form={form} />
      )}
    </>
  )
}