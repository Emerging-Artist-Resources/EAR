import {
  formatServiceInquiryAnswerForDisplay,
  parseServiceInquiryMultiselectItems,
} from "@/lib/service-inquiries/format-service-inquiry-answer-display"
import type {
  ServiceInquiryPdfFieldRow,
  ServiceInquiryPdfInput,
} from "@/lib/service-inquiries/service-inquiry-pdf-types"
import { splitSubmitterName } from "@/lib/service-inquiries/service-inquiry-pdf-types"

export type DocumentationInquiryPdfInput = Omit<ServiceInquiryPdfInput, "documentTitle">

type QuestionRow = {
  id: string
  question_text: string
  field_type: string
  order_index: number
}

function normalizeQuestionText(text: string) {
  return text.toLowerCase().trim()
}

function rowForQuestion(
  q: QuestionRow,
  answersByQuestionId: Map<string, string>,
): ServiceInquiryPdfFieldRow {
  const raw = answersByQuestionId.get(q.id) ?? ""
  const value = formatServiceInquiryAnswerForDisplay(q.field_type, raw)

  if (q.field_type === "multiselect") {
    const items = parseServiceInquiryMultiselectItems(raw)
    if (items.length === 0) {
      return { label: q.question_text, value: "—" }
    }
    return {
      label: q.question_text,
      value,
      variant: "multiselect",
      multiselectItems: items,
    }
  }

  if (q.field_type === "textarea") {
    return { label: q.question_text, value: value.trim() ? value : "—", variant: "long" }
  }

  return { label: q.question_text, value: value.trim() ? value : "—" }
}

/**
 * Builds PDF structure mirroring the documentation inquiry form (contact + project sections).
 */
export function buildDocumentationInquiryPdfInput(params: {
  inquiryId: string
  submittedAtLabel: string
  submitterName: string
  submitterEmail: string
  questions: QuestionRow[]
  answersByQuestionId: Map<string, string>
}): DocumentationInquiryPdfInput {
  const { firstName, lastName } = splitSubmitterName(params.submitterName)
  const sorted = [...params.questions].sort((a, b) => a.order_index - b.order_index)
  const pronounsQuestion =
    sorted.find(
      (q) =>
        q.field_type === "text" && normalizeQuestionText(q.question_text) === "pronouns",
    ) ?? null
  const projectQuestions = pronounsQuestion
    ? sorted.filter((q) => q.id !== pronounsQuestion.id)
    : sorted

  const contactRows: ServiceInquiryPdfFieldRow[] = [
    { label: "First Name", value: firstName.trim() || "—" },
    { label: "Last Name", value: lastName.trim() || "—" },
    { label: "Email Address", value: params.submitterEmail.trim() || "—" },
  ]

  if (pronounsQuestion) {
    contactRows.push(rowForQuestion(pronounsQuestion, params.answersByQuestionId))
  }

  const projectRows = projectQuestions.map((q) =>
    rowForQuestion(q, params.answersByQuestionId),
  )

  return {
    inquiryId: params.inquiryId,
    submittedAtLabel: params.submittedAtLabel,
    submitterName: params.submitterName,
    submitterEmail: params.submitterEmail,
    sections: [
      { title: "Contact information", rows: contactRows },
      { title: "Project details", rows: projectRows },
    ],
  }
}
