"use client"

import { UseFormReturn } from "react-hook-form"
import type { EventFormData } from "@/lib/validations/events"
import { TextField } from "@/components/forms/blocks/TextField"

type ListingWebsiteFieldProps = {
  form: UseFormReturn<EventFormData>
  /** Defaults to optional website helper copy when omitted. */
  note?: string
}

/**
 * Optional listing website (audition / creative / class-workshop).
 * Stored as `website` on type-specific detail rows; form field is `listingWebsite`.
 */
const DEFAULT_WEBSITE_NOTE = "Optional: Link to your company, project, or event page."

export function ListingWebsiteField({ form, note }: ListingWebsiteFieldProps) {
  return (
    <TextField
      form={form as unknown as UseFormReturn<Record<string, unknown>>}
      name="listingWebsite"
      label="Website"
      placeholder={note ?? DEFAULT_WEBSITE_NOTE}
    />
  )
}
