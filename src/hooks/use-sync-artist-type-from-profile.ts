"use client"

import { useEffect } from "react"
import { Path, UseFormReturn } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { useProfileEligibility } from "@/hooks/use-profile-eligibility"

export type FormArtistType = "ESTABLISHED" | "EMERGING"

export function profileArtistStatusToFormType(
  artistStatus: "emerging" | "established" | null
): FormArtistType | undefined {
  if (artistStatus === "established") return "ESTABLISHED"
  if (artistStatus === "emerging") return "EMERGING"
  return undefined
}

/** Sync profile artist status into a hidden form field for listing metadata. */
export function useSyncArtistTypeFromProfile(
  form: UseFormReturn<EventFormData>,
  fieldName: Path<EventFormData>
): { artistType: FormArtistType | undefined; isLoading: boolean } {
  const { artistStatus, isLoading } = useProfileEligibility()
  const artistType = profileArtistStatusToFormType(artistStatus)

  useEffect(() => {
    if (artistType && !isLoading) {
      form.setValue(fieldName, artistType as unknown as never)
    }
  }, [artistType, isLoading, form, fieldName])

  return { artistType, isLoading }
}
