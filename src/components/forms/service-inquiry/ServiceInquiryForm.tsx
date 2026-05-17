"use client"

import { useEffect, useMemo, useState } from "react"
import { FormProvider, useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { DynamicServiceInquiryFields } from "@/components/forms/service-inquiry/DynamicServiceInquiryFields"
import type { DynamicServiceInquiryFieldsProps } from "@/components/forms/service-inquiry/DynamicServiceInquiryFields"
import { ServiceInquiryLayout } from "@/components/forms/service-inquiry/ServiceInquiryLayout"
import { ServiceInquirySuccessScreen } from "@/components/forms/service-inquiry/ServiceInquirySuccessScreen"
import { inquiryLayoutSpacing } from "@/components/forms/service-inquiry/inquiry-layout-spacing"
import { Text } from "@/components/ui/typography"
import { useToast } from "@/contexts/ToastContext"
import { useServiceInquiryAuthPrefill } from "@/hooks/use-service-inquiry-auth-prefill"
import { useServiceInquiryFormErrors } from "@/hooks/use-service-inquiry-form-errors"
import { apiPost } from "@/lib/fetch-utils"
import { buildServiceInquiryAnswers } from "@/lib/service-inquiries/build-service-inquiry-answers"
import { loadServiceInquiryQuestions } from "@/lib/service-inquiries/load-service-inquiry-questions"
import type { ServiceInquiryContent } from "@/lib/service-inquiries/inquiry-content-types"
import {
  buildServiceInquiryFieldOrder,
  type ServiceInquiryQuestionRow,
} from "@/lib/service-inquiries/service-inquiry-questions"
import {
  buildDynamicServiceInquirySchema,
  dynamicServiceInquiryDefaultValues,
  SERVICE_INQUIRY_DYNAMIC_ERROR_FALLBACK,
  type DynamicServiceInquiryFormData,
} from "@/lib/validations/service-inquiry-dynamic"

export type ServiceInquiryFormProps = {
  serviceSlug: string
  content: ServiceInquiryContent
  backHref: string
  backLabel: string
  successBackLabel: string
  /** Page heading; falls back to `content.formTitle`. */
  title?: string
  questionNote?: DynamicServiceInquiryFieldsProps["questionNote"]
  partitionQuestions?: DynamicServiceInquiryFieldsProps["partitionQuestions"]
  contactSectionTitle?: string
  projectSectionTitle?: string
  projectSectionDescription?: string
}

export function ServiceInquiryForm({
  serviceSlug,
  content,
  backHref,
  backLabel,
  successBackLabel,
  title,
  questionNote,
  partitionQuestions,
  contactSectionTitle,
  projectSectionTitle,
  projectSectionDescription,
}: ServiceInquiryFormProps) {
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<ServiceInquiryQuestionRow[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  const formTitle = title ?? content.formTitle ?? "Inquiry form"

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setLoadError(null)
      const result = await loadServiceInquiryQuestions(serviceSlug)
      if (!result.ok) {
        setLoadError(result.error)
        setLoading(false)
        return
      }
      setQuestions(result.questions)
      setLoading(false)
    }
    void run()
  }, [serviceSlug])

  if (loading) {
    return (
      <div className={inquiryLayoutSpacing.page}>
        <Text className="text-muted-foreground">Loading form…</Text>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className={inquiryLayoutSpacing.page}>
        <Text className="text-destructive">{loadError}</Text>
      </div>
    )
  }

  return (
    <ServiceInquiryFormInner
      serviceSlug={serviceSlug}
      content={content}
      backHref={backHref}
      backLabel={backLabel}
      successBackLabel={successBackLabel}
      formTitle={formTitle}
      questions={questions}
      questionNote={questionNote}
      partitionQuestions={partitionQuestions}
      contactSectionTitle={contactSectionTitle}
      projectSectionTitle={projectSectionTitle}
      projectSectionDescription={projectSectionDescription}
    />
  )
}

function ServiceInquiryFormInner({
  serviceSlug,
  content,
  backHref,
  backLabel,
  successBackLabel,
  formTitle,
  questions,
  questionNote,
  partitionQuestions,
  contactSectionTitle,
  projectSectionTitle,
  projectSectionDescription,
}: ServiceInquiryFormProps & {
  formTitle: string
  questions: ServiceInquiryQuestionRow[]
}) {
  const { showToast } = useToast()
  const [submitted, setSubmitted] = useState(false)
  const [showErrorSummary, setShowErrorSummary] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const schema = useMemo(() => buildDynamicServiceInquirySchema(questions), [questions])

  const form = useForm<DynamicServiceInquiryFormData>({
    resolver: zodResolver(schema) as Resolver<DynamicServiceInquiryFormData>,
    defaultValues: dynamicServiceInquiryDefaultValues,
    mode: "onBlur",
  })

  useServiceInquiryAuthPrefill(form)

  const fieldOrder = useMemo(
    () => buildServiceInquiryFieldOrder(questions, partitionQuestions),
    [questions, partitionQuestions],
  )

  const { hasErrors, reportValidationFailure, resolveErrorMessage } = useServiceInquiryFormErrors(
    form,
    {
      fieldOrder,
      schema,
      fallbackMessage: SERVICE_INQUIRY_DYNAMIC_ERROR_FALLBACK,
      nestedErrorRoots: ["answers", "answerOther"],
    },
  )

  const errorBannerMessage =
    showErrorSummary && hasErrors ? resolveErrorMessage() : null

  const handleSubmit = form.handleSubmit(async (data) => {
    setSubmitting(true)
    try {
      const answers = buildServiceInquiryAnswers(data, questions)
      const name = `${data.firstName.trim()} ${data.lastName.trim()}`.trim()

      await apiPost<{ id: string }>("/api/service-inquiries", {
        service_slug: serviceSlug,
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
    const valid = await form.trigger()
    if (!valid) {
      reportValidationFailure(setShowErrorSummary, showToast)
      return
    }
    await handleSubmit()
  }

  const handleSubmitAnother = () => {
    form.reset(dynamicServiceInquiryDefaultValues)
    setSubmitted(false)
    setShowErrorSummary(false)
  }

  return (
    <FormProvider {...form}>
      <ServiceInquiryLayout
        backHref={backHref}
        backLabel={backLabel}
        title={formTitle}
        submitted={submitted}
        currentPage={1}
        totalPages={1}
        errorBannerMessage={errorBannerMessage}
        submitting={submitting}
        isLastPage
        onSubmit={() => void handleSubmitClick()}
        success={
          <ServiceInquirySuccessScreen
            content={content}
            backHref={backHref}
            backLabel={successBackLabel}
            onSubmitAnother={handleSubmitAnother}
          />
        }
      >
        <DynamicServiceInquiryFields
          questions={questions}
          questionNote={questionNote}
          partitionQuestions={partitionQuestions}
          contactSectionTitle={contactSectionTitle}
          projectSectionTitle={projectSectionTitle}
          projectSectionDescription={projectSectionDescription}
        />
      </ServiceInquiryLayout>
    </FormProvider>
  )
}
