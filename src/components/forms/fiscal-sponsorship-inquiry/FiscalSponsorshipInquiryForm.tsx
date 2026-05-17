"use client"

import { useEffect, useState } from "react"
import { FormProvider, useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { InquiryPage1Contact } from "@/components/forms/fiscal-sponsorship-inquiry/steps/InquiryPage1Contact"
import { InquiryPage2Organization } from "@/components/forms/fiscal-sponsorship-inquiry/steps/InquiryPage2Organization"
import { InquiryPage3Sponsorship } from "@/components/forms/fiscal-sponsorship-inquiry/steps/InquiryPage3Sponsorship"
import { ServiceInquiryLayout } from "@/components/forms/service-inquiry/ServiceInquiryLayout"
import { ServiceInquirySuccessScreen } from "@/components/forms/service-inquiry/ServiceInquirySuccessScreen"
import { useToast } from "@/contexts/ToastContext"
import { useServiceInquiryAuthPrefill } from "@/hooks/use-service-inquiry-auth-prefill"
import {
  useFiscalSponsorshipInquiryStepValidation,
  type FiscalSponsorshipInquiryPage,
} from "@/hooks/use-fiscal-sponsorship-inquiry-step-validation"
import { fiscalSponsorshipInquiryContent } from "@/lib/fiscal-sponsorship-inquiry-content"
import { FISCAL_SPONSORSHIP_INQUIRY_TOTAL_PAGES } from "@/lib/service-inquiries/fiscal-sponsorship-form-config"
import { FISCAL_SPONSORSHIP_SERVICE_SLUG } from "@/lib/service-inquiries/fiscal-sponsorship-options"
import {
  buildFiscalSponsorshipAnswers,
  fetchFiscalSponsorshipQuestionIdMap,
} from "@/lib/service-inquiries/build-fiscal-sponsorship-answers"
import { apiPost } from "@/lib/fetch-utils"
import {
  fiscalSponsorshipInquiryDefaultValues,
  fiscalSponsorshipInquirySchema,
  type FiscalSponsorshipInquiryFormData,
} from "@/lib/validations/fiscal-sponsorship-inquiry"

const BACK_HREF = "/services/fiscal-sponsorship"
const BACK_LABEL = "← Back to Fiscal sponsorship"
const SUCCESS_BACK_LABEL = "Back to Fiscal sponsorship"

export function FiscalSponsorshipInquiryForm({ title }: { title?: string }) {
  const [page, setPage] = useState<FiscalSponsorshipInquiryPage>(1)
  const [submitted, setSubmitted] = useState(false)
  const [showErrorSummary, setShowErrorSummary] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()
  const formTitle = title ?? fiscalSponsorshipInquiryContent.formTitle ?? "Inquiry form"
  const form = useForm<FiscalSponsorshipInquiryFormData>({
    resolver: zodResolver(fiscalSponsorshipInquirySchema) as Resolver<FiscalSponsorshipInquiryFormData>,
    defaultValues: fiscalSponsorshipInquiryDefaultValues,
    mode: "onBlur",
  })

  useServiceInquiryAuthPrefill(form)

  const { validatePage, hasErrors, reportValidationFailure, resolveErrorMessage } =
    useFiscalSponsorshipInquiryStepValidation(form, page)

  useEffect(() => {
    setShowErrorSummary(false)
  }, [page])

  const errorBannerMessage =
    showErrorSummary && hasErrors ? resolveErrorMessage() : null

  const goNext = async () => {
    const valid = await validatePage()
    if (!valid) {
      reportValidationFailure(setShowErrorSummary, showToast)
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
      reportValidationFailure(setShowErrorSummary, showToast)
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
      <ServiceInquiryLayout
        backHref={BACK_HREF}
        backLabel={BACK_LABEL}
        title={formTitle}
        submitted={submitted}
        currentPage={page}
        totalPages={FISCAL_SPONSORSHIP_INQUIRY_TOTAL_PAGES}
        errorBannerMessage={errorBannerMessage}
        submitting={submitting}
        isLastPage={isLastPage}
        onBack={goBack}
        onContinue={() => void goNext()}
        onSubmit={() => void handleSubmitClick()}
        success={
          <ServiceInquirySuccessScreen
            content={fiscalSponsorshipInquiryContent}
            backHref={BACK_HREF}
            backLabel={SUCCESS_BACK_LABEL}
            onSubmitAnother={handleSubmitAnother}
          />
        }
      >
        {page === 1 && <InquiryPage1Contact />}
        {page === 2 && <InquiryPage2Organization />}
        {page === 3 && <InquiryPage3Sponsorship />}
      </ServiceInquiryLayout>
    </FormProvider>
  )
}
