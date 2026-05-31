"use client"

import { ServiceInquiryForm } from "@/components/forms/service-inquiry/ServiceInquiryForm"
import { fiscalServicesInquiryContent } from "@/lib/content/fiscal-services-inquiry"
import {
  FISCAL_SERVICES_SERVICE_SLUG,
  fiscalServicesQuestionNote,
  partitionFiscalServicesQuestions,
} from "@/lib/service-inquiries/fiscal-services-options"

const BACK_HREF = "/services/fiscal-services"
const BACK_LABEL = "← Back to Fiscal Services"
const SUCCESS_BACK_LABEL = "Back to Fiscal Services"

export type FiscalServicesInquiryFormProps = {
  /** Page heading; overrides `fiscalServicesInquiryContent.formTitle`. */
  title?: string
}

export function FiscalServicesInquiryForm({ title }: FiscalServicesInquiryFormProps = {}) {
  return (
    <ServiceInquiryForm
      serviceSlug={FISCAL_SERVICES_SERVICE_SLUG}
      content={fiscalServicesInquiryContent}
      backHref={BACK_HREF}
      backLabel={BACK_LABEL}
      successBackLabel={SUCCESS_BACK_LABEL}
      title={title}
      partitionQuestions={partitionFiscalServicesQuestions}
      questionNote={fiscalServicesQuestionNote}
      projectSectionTitle="Fiscal services"
      projectSectionDescription="Tell us about your budget and which services you need."
    />
  )
}
