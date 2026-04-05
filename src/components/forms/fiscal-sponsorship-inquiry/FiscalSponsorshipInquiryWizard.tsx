"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FormProvider, useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormStepErrorSummary } from "@/components/forms/blocks/FormStepErrorSummary"
import { PageNumbers } from "@/components/forms/blocks/PageNumbers"
import { InquiryIntroStep } from "@/components/forms/fiscal-sponsorship-inquiry/steps/InquiryIntroStep"
import { InquiryStep2 } from "@/components/forms/fiscal-sponsorship-inquiry/steps/InquiryStep2"
import { InquiryStep3 } from "@/components/forms/fiscal-sponsorship-inquiry/steps/InquiryStep3"
import { InquiryStep4 } from "@/components/forms/fiscal-sponsorship-inquiry/steps/InquiryStep4"
import { InquiryStep5 } from "@/components/forms/fiscal-sponsorship-inquiry/steps/InquiryStep5"
import { InquiryStep6 } from "@/components/forms/fiscal-sponsorship-inquiry/steps/InquiryStep6"
import { Button } from "@/components/ui/button"
import { H1, Text } from "@/components/ui/typography"
import { useToast } from "@/contexts/ToastContext"
import { useFiscalSponsorshipInquiryStep2Validation } from "@/hooks/use-fiscal-sponsorship-inquiry-step2-validation"
import {
  fiscalSponsorshipInquiryIntro,
  FISCAL_SPONSORSHIP_INQUIRY_TOTAL_STEPS,
} from "@/lib/fiscal-sponsorship-inquiry-content"
import {
  FISCAL_SPONSORSHIP_INQUIRY_STEP2_ERROR_FALLBACK,
  fiscalSponsorshipInquirySchema,
  fiscalSponsorshipInquiryStep2Fields,
  type FiscalSponsorshipInquiryFormData,
} from "@/lib/validations/fiscal-sponsorship-inquiry"

export function FiscalSponsorshipInquiryWizard() {
  const [step, setStep] = useState(1)
  const [showStep2ErrorSummary, setShowStep2ErrorSummary] = useState(false)
  const { showToast } = useToast()

  const form = useForm<FiscalSponsorshipInquiryFormData>({
    resolver: zodResolver(fiscalSponsorshipInquirySchema) as Resolver<FiscalSponsorshipInquiryFormData>,
    defaultValues: {
      firstName: "",
      lastName: "",
      pronouns: "",
      email: "",
      artistProjectOrOrgName: "",
      websiteSocialPortfolio: "",
      artistLocation: "",
    },
    mode: "onBlur",
  })

  const { handleSubmit } = form

  const { validateStep2, getFirstStep2Error, getFirstInvalidStep2FieldName } =
    useFiscalSponsorshipInquiryStep2Validation(form)

  useEffect(() => {
    if (step !== 2) setShowStep2ErrorSummary(false)
  }, [step])

  const hasStep2FieldErrors = fiscalSponsorshipInquiryStep2Fields.some(
    (f) => Boolean(form.formState.errors[f]),
  )
  const step2ErrorBannerMessage =
    step === 2 && showStep2ErrorSummary && hasStep2FieldErrors
      ? (getFirstStep2Error() ?? FISCAL_SPONSORSHIP_INQUIRY_STEP2_ERROR_FALLBACK)
      : null

  const goNext = async () => {
    if (step === 2) {
      const valid = await validateStep2()
      if (!valid) {
        setShowStep2ErrorSummary(true)
        showToast(
          getFirstStep2Error() ?? FISCAL_SPONSORSHIP_INQUIRY_STEP2_ERROR_FALLBACK,
          "error",
        )
        const firstInvalid = getFirstInvalidStep2FieldName()
        if (firstInvalid) {
          void form.setFocus(firstInvalid)
        }
        return
      }
      setShowStep2ErrorSummary(false)
    }
    if (step < FISCAL_SPONSORSHIP_INQUIRY_TOTAL_STEPS) {
      setStep((s) => s + 1)
    }
  }

  const goBack = () => {
    if (step > 1) {
      setStep((s) => s - 1)
    }
  }

  const onFinalSubmit = handleSubmit(() => {
    showToast("Inquiry submission is not connected yet. Wire an API route when ready.", "info")
  })

  const isLastStep = step === FISCAL_SPONSORSHIP_INQUIRY_TOTAL_STEPS

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
          <H1 className="text-foreground text-3xl font-bold tracking-tight">Inquiry form</H1>
          <Text className="text-muted-foreground">
            Step {step} of {FISCAL_SPONSORSHIP_INQUIRY_TOTAL_STEPS}
          </Text>
        </div>

        <div className="mb-8 flex justify-center">
          <PageNumbers current={step} total={FISCAL_SPONSORSHIP_INQUIRY_TOTAL_STEPS} />
        </div>

        <div className="bg-card text-card-foreground rounded-lg border border-border p-6 shadow-sm sm:p-8">
          {step === 2 && (
            <FormStepErrorSummary message={step2ErrorBannerMessage} className="mb-6" />
          )}
          {step === 1 && (
            <InquiryIntroStep
              title={fiscalSponsorshipInquiryIntro.title}
              body={fiscalSponsorshipInquiryIntro.body}
            />
          )}
          {step === 2 && <InquiryStep2 />}
          {step === 3 && <InquiryStep3 />}
          {step === 4 && <InquiryStep4 />}
          {step === 5 && <InquiryStep5 />}
          {step === 6 && <InquiryStep6 />}
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={goBack} disabled={step <= 1}>
            Back
          </Button>
          {isLastStep ? (
            <Button type="button" variant="default" onClick={() => void onFinalSubmit()}>
              Submit inquiry
            </Button>
          ) : (
            <Button type="button" variant="default" onClick={() => void goNext()}>
              Continue
            </Button>
          )}
        </div>
      </div>
    </FormProvider>
  )
}
