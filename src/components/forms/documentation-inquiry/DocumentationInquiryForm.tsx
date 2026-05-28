"use client"

import { ServiceInquiryForm } from "@/components/forms/service-inquiry/ServiceInquiryForm"
import { documentationInquiryContent } from "@/lib/content/documentation-inquiry"
import {
  DOCUMENTATION_SERVICE_SLUG,
  documentationQuestionNote,
  partitionDocumentationQuestions,
} from "@/lib/service-inquiries/documentation-options"

const BACK_HREF = "/services/photography-videography"
const BACK_LABEL = "← Back to Photography & Videography"
const SUCCESS_BACK_LABEL = "Back to Photography & Videography"

export type DocumentationInquiryFormProps = {
  /**
   * Page heading in the inquiry layout. Overrides `documentationInquiryContent.formTitle`.
   */
  title?: string
}

export function DocumentationInquiryForm({ title }: DocumentationInquiryFormProps = {}) {
  return (
    <ServiceInquiryForm
      serviceSlug={DOCUMENTATION_SERVICE_SLUG}
      content={documentationInquiryContent}
      backHref={BACK_HREF}
      backLabel={BACK_LABEL}
      successBackLabel={SUCCESS_BACK_LABEL}
      title={title}
      questionNote={documentationQuestionNote}
      partitionQuestions={partitionDocumentationQuestions}
      projectSectionDescription="Tell us about your documentation needs."
    />
  )
}
