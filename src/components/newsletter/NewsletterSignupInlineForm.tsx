"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { NewsletterSource } from "@/features/newsletter/constants"
import { useNewsletterSubscribe } from "@/hooks/use-newsletter-subscribe"
import { NewsletterSignupFormFields } from "./NewsletterSignupFormFields"

type NewsletterSignupInlineFormProps = {
  source: NewsletterSource
  sourceContext?: string
  submitLabel?: string
  className?: string
}

export function NewsletterSignupInlineForm({
  source,
  sourceContext,
  submitLabel = "Subscribe",
  className,
}: NewsletterSignupInlineFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const { values, setField, submit, loading } = useNewsletterSubscribe({
    source,
    sourceContext,
    onSuccess: () => setSubmitted(true),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submit()
  }

  if (submitted) {
    return (
      <p className={className ?? "text-sm text-ear-black"}>
        Thank you for subscribing. We&apos;ll be in touch soon.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={className ?? "space-y-4 text-left"}>
      <NewsletterSignupFormFields
        idPrefix={source}
        values={values}
        onChange={setField}
        labelSize="sm"
      />
      <Button
        type="submit"
        disabled={loading}
        className="h-auto w-full rounded-none bg-ear-dark-red px-8 py-3 text-xs font-semibold uppercase tracking-widest text-ear-off-white hover:bg-ear-dark-red/90 sm:w-auto"
      >
        {loading ? "Saving…" : submitLabel}
      </Button>
    </form>
  )
}
