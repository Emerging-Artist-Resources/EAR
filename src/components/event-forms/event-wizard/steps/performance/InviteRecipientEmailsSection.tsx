"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MAX_SHARE_RECIPIENT_EMAILS } from "@/lib/listings/share"

export interface InviteRecipientEmailsSectionProps {
  form: UseFormReturn<EventFormData>
  title: string
  description: string
  addEmailLabel?: string
}

export function InviteRecipientEmailsSection({
  form,
  title,
  description,
  addEmailLabel = "Add email",
}: InviteRecipientEmailsSectionProps) {
  const emails =
    useWatch({
      control: form.control,
      name: "shareRecipientEmails" as Path<EventFormData>,
      defaultValue: [],
    }) ?? []

  const list = Array.isArray(emails) ? emails : []

  const updateAt = (index: number, value: string) => {
    const next = [...list]
    next[index] = value
    form.setValue("shareRecipientEmails" as Path<EventFormData>, next as never, {
      shouldValidate: true,
      shouldDirty: true,
    })
  }

  const removeAt = (index: number) => {
    const next = list.filter((_, i) => i !== index)
    form.setValue("shareRecipientEmails" as Path<EventFormData>, next as never, {
      shouldValidate: true,
      shouldDirty: true,
    })
  }

  const append = () => {
    if (list.length >= MAX_SHARE_RECIPIENT_EMAILS) return
    form.setValue("shareRecipientEmails" as Path<EventFormData>, [...list, ""] as never, {
      shouldValidate: true,
      shouldDirty: true,
    })
  }

  return (
    <Section title={title}>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      <div className="space-y-2">
        {list.map((value, index) => (
          <div key={index} className="flex gap-2 items-center">
            <Input
              type="email"
              placeholder="email@example.com"
              value={value ?? ""}
              onChange={(e) => updateAt(index, e.target.value)}
              className="flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={() => removeAt(index)}>
              Remove
            </Button>
          </div>
        ))}
      </div>
      {list.length < MAX_SHARE_RECIPIENT_EMAILS && (
        <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={append}>
          {addEmailLabel}
        </Button>
      )}
      <p className="text-xs text-muted-foreground mt-2">
        Add up to {MAX_SHARE_RECIPIENT_EMAILS} addresses.
      </p>
    </Section>
  )
}
