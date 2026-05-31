"use client"

import { UseFormReturn } from "react-hook-form"
import type { EventFormData } from "@/lib/validations/events"
import { TextField } from "@/components/forms/blocks/TextField"

type ListingWebsiteFieldProps = {
  form: UseFormReturn<EventFormData>
  /** Helper text below the "Website" label (e.g. "Optional"). */
  note?: string
  /** Input placeholder (URL hint). */
  placeholder?: string
}

const DEFAULT_PLACEHOLDER = "https://…"

/**
 * Optional listing website (audition / opportunity / class-workshop).
 * Stored as `website` on type-specific detail rows; form field is `listingWebsite`.
 */
export function ListingWebsiteField({ form, note, placeholder }: ListingWebsiteFieldProps) {
  return (
    <TextField
      form={form as unknown as UseFormReturn<Record<string, unknown>>}
      name="listingWebsite"
      label="Website"
      note={note ?? ""}
      placeholder={placeholder ?? DEFAULT_PLACEHOLDER}
    />
  )
}
