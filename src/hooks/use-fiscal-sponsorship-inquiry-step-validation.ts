import { useCallback, useMemo } from "react"
import type { UseFormReturn } from "react-hook-form"
import { useServiceInquiryFormErrors } from "@/hooks/use-service-inquiry-form-errors"
import {
  fiscalSponsorshipInquiryFieldLabels,
  fiscalSponsorshipInquiryPageFields,
  fiscalSponsorshipInquiryPageSchemas,
  FISCAL_SPONSORSHIP_INQUIRY_ERROR_FALLBACK,
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

  const fieldOrder = useMemo(
    () => fields.map((field) => String(field)),
    [fields],
  )

  const errors = useServiceInquiryFormErrors(form, {
    fieldOrder,
    schema,
    fallbackMessage: FISCAL_SPONSORSHIP_INQUIRY_ERROR_FALLBACK,
    labelFor: (path) => labelFor(path as keyof FiscalSponsorshipInquiryFormData),
  })

  const validatePage = useCallback(async (): Promise<boolean> => {
    const ok = await form.trigger(fields)
    if (!ok) return false
    const parsed = schema.safeParse(form.getValues())
    return parsed.success
  }, [form, fields, schema])

  return {
    validatePage,
    ...errors,
  }
}
