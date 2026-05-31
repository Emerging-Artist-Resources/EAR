"use client"

import { useCallback, useState } from "react"
import { useToast } from "@/contexts/ToastContext"
import type { NewsletterSource } from "@/features/newsletter/constants"
import { subscribeToNewsletters } from "@/lib/newsletter/subscribe-client"

export type NewsletterFormValues = {
  firstName: string
  lastName: string
  email: string
  ear: boolean
  calendar: boolean
}

const initialValues: NewsletterFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  ear: true,
  calendar: true,
}

type UseNewsletterSubscribeOptions = {
  source: NewsletterSource
  sourceContext?: string
  onSuccess?: () => void
}

export function useNewsletterSubscribe({
  source,
  sourceContext,
  onSuccess,
}: UseNewsletterSubscribeOptions) {
  const { showToast } = useToast()
  const [values, setValues] = useState<NewsletterFormValues>(initialValues)
  const [loading, setLoading] = useState(false)

  const setField = useCallback(
    <K extends keyof NewsletterFormValues>(key: K, value: NewsletterFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const reset = useCallback(() => {
    setValues(initialValues)
  }, [])

  const submit = useCallback(async () => {
    if (!values.ear && !values.calendar) {
      showToast("Select at least one email list.", "error")
      return false
    }

    setLoading(true)
    try {
      await subscribeToNewsletters({
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
        subscribed_to_newsletter: values.ear,
        subscribed_to_calendar: values.calendar,
        source,
        source_context: sourceContext,
      })
      showToast("You're subscribed. Thank you!", "success")
      reset()
      onSuccess?.()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again."
      showToast(message, "error")
      return false
    } finally {
      setLoading(false)
    }
  }, [values, source, sourceContext, showToast, reset, onSuccess])

  return {
    values,
    setField,
    reset,
    submit,
    loading,
  }
}
