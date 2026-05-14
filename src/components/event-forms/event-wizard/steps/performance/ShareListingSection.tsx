"use client"

import { UseFormReturn } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { InviteRecipientEmailsSection } from "@/components/event-forms/event-wizard/steps/performance/InviteRecipientEmailsSection"

export function ShareListingSection({ form }: { form: UseFormReturn<EventFormData> }) {
  return (
    <InviteRecipientEmailsSection
      form={form}
      title="Share this listing"
      description="We'll email these people after your listing is approved. They'll get a link to your public calendar listing on EAR."
    />
  )
}
