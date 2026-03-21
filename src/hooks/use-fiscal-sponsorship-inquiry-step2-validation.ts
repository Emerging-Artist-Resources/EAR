import { useCallback } from "react"
import type { UseFormReturn } from "react-hook-form"
import { normalizeErrorMessage } from "@/lib/validation-helpers"
import {
  fiscalSponsorshipInquiryFieldLabels,
  fiscalSponsorshipInquirySchema,
  fiscalSponsorshipInquiryStep2Fields,
  type FiscalSponsorshipInquiryFormData,
} from "@/lib/validations/fiscal-sponsorship-inquiry"

function labelFor(field: keyof FiscalSponsorshipInquiryFormData): string {
  return fiscalSponsorshipInquiryFieldLabels[field]
}

/**
 * Step-2 validation for the fiscal sponsorship inquiry wizard.
 * Mirrors {@link useStepValidation} / event wizard patterns: trigger + getFirstError for UX.
 */
export function useFiscalSponsorshipInquiryStep2Validation(
  form: UseFormReturn<FiscalSponsorshipInquiryFormData>,
) {
  const validateStep2 = useCallback(async (): Promise<boolean> => {
    const ok = await form.trigger([...fiscalSponsorshipInquiryStep2Fields])
    if (!ok) return false
    const parsed = fiscalSponsorshipInquirySchema.safeParse(form.getValues())
    return parsed.success
  }, [form])

  const getFirstStep2Error = useCallback((): string | null => {
    const errors = form.formState.errors
    for (const field of fiscalSponsorshipInquiryStep2Fields) {
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

    const parsed = fiscalSponsorshipInquirySchema.safeParse(form.getValues())
    if (!parsed.success && parsed.error?.issues[0]) {
      const issue = parsed.error.issues[0]
      const path = issue.path[0]
      if (path !== undefined && path in fiscalSponsorshipInquiryFieldLabels) {
        const key = path as keyof FiscalSponsorshipInquiryFormData
        return normalizeErrorMessage(issue.message || "", labelFor(key)) || `${labelFor(key)} is required`
      }
    }

    return null
  }, [form])

  const getFirstInvalidStep2FieldName = useCallback((): keyof FiscalSponsorshipInquiryFormData | null => {
    for (const field of fiscalSponsorshipInquiryStep2Fields) {
      if (form.getFieldState(field).invalid) return field
    }
    return null
  }, [form])

  return {
    validateStep2,
    getFirstStep2Error,
    getFirstInvalidStep2FieldName,
  }
}
