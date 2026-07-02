"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Caption } from "@/components/ui/typography"
import { MAX_SHARE_RECIPIENT_EMAILS } from "@/lib/listings/share"
import { stack } from "@/lib/spacing"

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
    <Section title={title} description={description}>
      <div className={stack.sm}>
        {list.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
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
        {list.length < MAX_SHARE_RECIPIENT_EMAILS && (
          <Button type="button" variant="secondary" size="sm" onClick={append}>
            {addEmailLabel}
          </Button>
        )}
        <Caption className="text-text-muted">Add up to {MAX_SHARE_RECIPIENT_EMAILS} addresses.</Caption>
      </div>
    </Section>
  )
}
