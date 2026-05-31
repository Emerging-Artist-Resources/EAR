"use client"

import type { ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  MAILCHIMP_GROUP_CALENDAR,
  MAILCHIMP_GROUP_EAR,
} from "@/features/newsletter/constants"
import type { NewsletterFormValues } from "@/hooks/use-newsletter-subscribe"
import { NewsletterFieldLabel, NewsletterRequiredHint } from "./NewsletterFieldLabel"

type NewsletterSignupFormFieldsProps = {
  idPrefix: string
  values: NewsletterFormValues
  onChange: <K extends keyof NewsletterFormValues>(key: K, value: NewsletterFormValues[K]) => void
  labelSize?: "sm" | "md"
  showRequiredHint?: boolean
  intro?: ReactNode
}

export function NewsletterSignupFormFields({
  idPrefix,
  values,
  onChange,
  labelSize = "sm",
  showRequiredHint = true,
  intro,
}: NewsletterSignupFormFieldsProps) {
  return (
    <>
      {intro}
      {showRequiredHint ? <NewsletterRequiredHint /> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <NewsletterFieldLabel htmlFor={`${idPrefix}-first-name`} required size={labelSize}>
            First name
          </NewsletterFieldLabel>
          <Input
            id={`${idPrefix}-first-name`}
            type="text"
            autoComplete="given-name"
            required
            aria-required
            value={values.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
          />
        </div>
        <div>
          <NewsletterFieldLabel htmlFor={`${idPrefix}-last-name`} required size={labelSize}>
            Last name
          </NewsletterFieldLabel>
          <Input
            id={`${idPrefix}-last-name`}
            type="text"
            autoComplete="family-name"
            required
            aria-required
            value={values.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
          />
        </div>
      </div>
      <div>
        <NewsletterFieldLabel htmlFor={`${idPrefix}-email`} required size={labelSize}>
          Email
        </NewsletterFieldLabel>
        <Input
          id={`${idPrefix}-email`}
          type="email"
          autoComplete="email"
          required
          aria-required
          value={values.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <fieldset className="space-y-2.5">
        <legend className="mb-1 text-xs font-medium text-gray-700">
          Email lists <span className="text-error-600">*</span>
        </legend>
        <p className="sr-only">Select at least one email list.</p>
        <label className="flex items-start gap-2 text-sm text-gray-800">
          <Checkbox
            checked={values.ear}
            onChange={(e) => onChange("ear", (e.target as HTMLInputElement).checked)}
            className="mt-0.5"
          />
          <span>{MAILCHIMP_GROUP_EAR}</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-gray-800">
          <Checkbox
            checked={values.calendar}
            onChange={(e) => onChange("calendar", (e.target as HTMLInputElement).checked)}
            className="mt-0.5"
          />
          <span>{MAILCHIMP_GROUP_CALENDAR}</span>
        </label>
      </fieldset>
    </>
  )
}
