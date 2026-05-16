"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FormProvider, useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormStepErrorSummary } from "@/components/forms/blocks/FormStepErrorSummary"
import { PageNumbers } from "@/components/forms/blocks/PageNumbers"
import { InquiryPage1Contact } from "@/components/forms/fiscal-sponsorship-inquiry/steps/InquiryPage1Contact"
import { InquiryPage2Organization } from "@/components/forms/fiscal-sponsorship-inquiry/steps/InquiryPage2Organization"
import { InquiryPage3Sponsorship } from "@/components/forms/fiscal-sponsorship-inquiry/steps/InquiryPage3Sponsorship"
import { InquirySuccessScreen } from "@/components/forms/fiscal-sponsorship-inquiry/steps/InquirySuccessScreen"
import { Button } from "@/components/ui/button"
import { H1, Text } from "@/components/ui/typography"
import { useToast } from "@/contexts/ToastContext"
import { useAuth } from "@/hooks/use-auth"
import {
  useFiscalSponsorshipInquiryStepValidation,
  type FiscalSponsorshipInquiryPage,
} from "@/hooks/use-fiscal-sponsorship-inquiry-step-validation"
import { FISCAL_SPONSORSHIP_INQUIRY_TOTAL_PAGES } from "@/lib/service-inquiries/fiscal-sponsorship-form-config"
import { FISCAL_SPONSORSHIP_SERVICE_SLUG } from "@/lib/service-inquiries/fiscal-sponsorship-options"
import {
  buildFiscalSponsorshipAnswers,
  fetchFiscalSponsorshipQuestionIdMap,
} from "@/lib/service-inquiries/build-fiscal-sponsorship-answers"
import { apiPost } from "@/lib/fetch-utils"
import {
  FISCAL_SPONSORSHIP_INQUIRY_ERROR_FALLBACK,
  fiscalSponsorshipInquiryDefaultValues,
  fiscalSponsorshipInquiryPageFields,
  fiscalSponsorshipInquirySchema,
  type FiscalSponsorshipInquiryFormData,
} from "@/lib/validations/fiscal-sponsorship-inquiry"

export function FiscalSponsorshipInquiryForm() {
  const [page, setPage] = useState<FiscalSponsorshipInquiryPage>(1)
  const [submitted, setSubmitted] = useState(false)
  const [showErrorSummary, setShowErrorSummary] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()
  const { user, userName } = useAuth()

  const form = useForm<FiscalSponsorshipInquiryFormData>({
    resolver: zodResolver(fiscalSponsorshipInquirySchema) as Resolver<FiscalSponsorshipInquiryFormData>,
    defaultValues: fiscalSponsorshipInquiryDefaultValues,
    mode: "onBlur",
  })

  const { validatePage, getFirstError, getFirstInvalidFieldName } =
    useFiscalSponsorshipInquiryStepValidation(form, page)

  useEffect(() => {
    if (user?.email && !form.getValues("email")) {
      form.setValue("email", user.email)
    }
    if (userName) {
      const parts = userName.trim().split(/\s+/)
      if (parts.length >= 2) {
        if (!form.getValues("firstName")) form.setValue("firstName", parts[0] ?? "")
        if (!form.getValues("lastName")) form.setValue("lastName", parts.slice(1).join(" "))
      } else if (!form.getValues("firstName")) {
        form.setValue("firstName", userName)
      }
    }
  }, [user, userName, form])

  useEffect(() => {
    setShowErrorSummary(false)
  }, [page])

  const pageFields = fiscalSponsorshipInquiryPageFields[page]
  const hasPageErrors = pageFields.some((f) => Boolean(form.formState.errors[f]))
  const errorBannerMessage =
    showErrorSummary && hasPageErrors
      ? (getFirstError() ?? FISCAL_SPONSORSHIP_INQUIRY_ERROR_FALLBACK)
      : null

  const goNext = async () => {
    const valid = await validatePage()
    if (!valid) {
      setShowErrorSummary(true)
      showToast(getFirstError() ?? FISCAL_SPONSORSHIP_INQUIRY_ERROR_FALLBACK, "error")
      const firstInvalid = getFirstInvalidFieldName()
      if (firstInvalid) {
        void form.setFocus(firstInvalid)
      }
      return
    }
    setShowErrorSummary(false)
    if (page < FISCAL_SPONSORSHIP_INQUIRY_TOTAL_PAGES) {
      setPage((p) => (p + 1) as FiscalSponsorshipInquiryPage)
    }
  }

  const goBack = () => {
    if (page > 1) {
      setPage((p) => (p - 1) as FiscalSponsorshipInquiryPage)
    }
  }

  const onSubmit = form.handleSubmit(async (data) => {
    setSubmitting(true)
    try {
      const questionIdByKey = await fetchFiscalSponsorshipQuestionIdMap()
      const answers = buildFiscalSponsorshipAnswers(data, questionIdByKey)
      const name = `${data.firstName.trim()} ${data.lastName.trim()}`.trim()

      await apiPost<{ id: string }>("/api/service-inquiries", {
        service_slug: FISCAL_SPONSORSHIP_SERVICE_SLUG,
        name,
        email: data.email.trim(),
        answers,
      })

      showToast("Thanks — we received your inquiry.", "success")
      setSubmitted(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong."
      showToast(msg, "error")
    } finally {
      setSubmitting(false)
    }
  })

  const handleSubmitClick = async () => {
    const valid = await validatePage()
    if (!valid) {
      setShowErrorSummary(true)
      showToast(getFirstError() ?? FISCAL_SPONSORSHIP_INQUIRY_ERROR_FALLBACK, "error")
      const firstInvalid = getFirstInvalidFieldName()
      if (firstInvalid) {
        void form.setFocus(firstInvalid)
      }
      return
    }
    await onSubmit()
  }

  const handleSubmitAnother = () => {
    form.reset(fiscalSponsorshipInquiryDefaultValues)
    setSubmitted(false)
    setPage(1)
    setShowErrorSummary(false)
  }

  const isLastPage = page === FISCAL_SPONSORSHIP_INQUIRY_TOTAL_PAGES

  return (
    <FormProvider {...form}>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-2">
          <Link
            href="/services/fiscal-sponsorship"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium underline"
          >
            ← Back to Fiscal sponsorship
          </Link>
          {!submitted ? (
            <>
              <H1 className="text-foreground text-3xl font-bold tracking-tight">Inquiry form</H1>
              <Text className="text-muted-foreground">
                Step {page} of {FISCAL_SPONSORSHIP_INQUIRY_TOTAL_PAGES}
              </Text>
            </>
          ) : null}
        </div>

        {submitted ? (
          <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm sm:p-8">
            <InquirySuccessScreen onSubmitAnother={handleSubmitAnother} />
          </div>
        ) : (
          <>
            <div className="mb-8 flex justify-center">
              <PageNumbers current={page} total={FISCAL_SPONSORSHIP_INQUIRY_TOTAL_PAGES} />
            </div>

            <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm sm:p-8">
              <FormStepErrorSummary message={errorBannerMessage} className="mb-6" />
              {page === 1 && <InquiryPage1Contact />}
              {page === 2 && <InquiryPage2Organization />}
              {page === 3 && <InquiryPage3Sponsorship />}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" onClick={goBack} disabled={page <= 1}>
                Back
              </Button>
              {isLastPage ? (
                <Button
                  type="button"
                  variant="default"
                  disabled={submitting}
                  onClick={() => void handleSubmitClick()}
                >
                  {submitting ? "Sending…" : "Submit inquiry"}
                </Button>
              ) : (
                <Button type="button" variant="default" onClick={() => void goNext()}>
                  Continue
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </FormProvider>
  )
}
