import { useCallback, useMemo } from "react"
import type { UseFormReturn } from "react-hook-form"
import { normalizeErrorMessage } from "@/lib/validation-helpers"
import {
  fiscalSponsorshipInquiryFieldLabels,
  fiscalSponsorshipInquiryPageFields,
  fiscalSponsorshipInquiryPageSchemas,
  type FiscalSponsorshipInquiryFormData,
} from "@/lib/validations/fiscal-sponsorship-inquiry"

export type FiscalSponsorshipInquiryPage = 1 | 2 | 3

function labelFor(field: keyof FiscalSponsorshipInquiryFormData): string {
  return fiscalSponsorshipInquiryFieldLabels[field]
}

export function useFiscalSponsorshipInquiryStepValidation(
  form: UseFormReturn<FiscalSponsorshipInquiryFormData>,
  page: FiscalSponsorshipInquiryPage,
) {
  const schema = useMemo(() => fiscalSponsorshipInquiryPageSchemas[page], [page])

  const fields = useMemo(
    (): (keyof FiscalSponsorshipInquiryFormData)[] => [...fiscalSponsorshipInquiryPageFields[page]],
    [page],
  )

  const validatePage = useCallback(async (): Promise<boolean> => {
    const ok = await form.trigger(fields)
    if (!ok) return false
    const parsed = schema.safeParse(form.getValues())
    return parsed.success
  }, [form, fields, schema])

  const getFirstError = useCallback((): string | null => {
    const errors = form.formState.errors
    for (const field of fields) {
      const error = errors[field]
      if (error && typeof error === "object" && "message" in error) {
        const message = error.message as string
        if (message) {
          return normalizeErrorMessage(message, labelFor(field))
        }
      }
      if (error) {
        return `${labelFor(field)} is required`
      }
    }

    const parsed = schema.safeParse(form.getValues())
    if (!parsed.success && parsed.error?.issues[0]) {
      const issue = parsed.error.issues[0]
      const path = issue.path[0]
      if (path !== undefined && path in fiscalSponsorshipInquiryFieldLabels) {
        const key = path as keyof FiscalSponsorshipInquiryFormData
        return (
          normalizeErrorMessage(issue.message || "", labelFor(key)) ||
          `${labelFor(key)} is required`
        )
      }
    }

    return null
  }, [form, fields, schema])

  const getFirstInvalidFieldName = useCallback((): keyof FiscalSponsorshipInquiryFormData | null => {
    for (const field of fields) {
      if (form.getFieldState(field).invalid) return field
    }
    return null
  }, [form, fields])

  return {
    validatePage,
    getFirstError,
    getFirstInvalidFieldName,
  }
}
