"use client"

import { UseFormReturn } from "react-hook-form"
import type { EventFormData } from "@/lib/validations/events"
import { TextField } from "@/components/forms/blocks/TextField"

type ListingWebsiteFieldProps = {
  form: UseFormReturn<EventFormData>
}

/**
 * Optional listing website (audition / creative / class-workshop).
 * Stored as `website` on type-specific detail rows; form field is `listingWebsite`.
 */
export function ListingWebsiteField({ form }: ListingWebsiteFieldProps) {
  return (
    <TextField
      form={form as unknown as UseFormReturn<Record<string, unknown>>}
      name="listingWebsite"
      label="Website"
      note="Optional. Link to your company, project, or event page."
      placeholder="https://example.com"
    />
  )
}
