/** Documentation service slug and field helpers (options live in `service_question_options`). */
export const DOCUMENTATION_SERVICE_SLUG = "documentation" as const

export {
  SERVICE_INQUIRY_OTHER_VALUE as DOCUMENTATION_OTHER_VALUE,
  type ServiceInquiryQuestionRow as DocumentationQuestionRow,
} from "@/lib/service-inquiries/service-inquiry-questions"

import type { ServiceInquiryQuestionRow } from "@/lib/service-inquiries/service-inquiry-questions"
import { buildServiceInquiryFieldOrder } from "@/lib/service-inquiries/service-inquiry-questions"

function normalizeQuestionText(text: string) {
  return text.toLowerCase().trim()
}

/** Helper copy shown under specific documentation inquiry fields. */
export function documentationQuestionNote(questionText: string): string | undefined {
  const key = normalizeQuestionText(questionText)

  if (key.includes("requested coverage length")) {
    return "Duration of performance, rehearsal, or event"
  }

  if (key.includes("budget")) {
    return [
      "Individual Photography & Videography Services: $60-$150/hr",
      "Combined Photography & Videography Packages: $110-$300/hr",
      "",
      "No one will be turned away due to lack of funds. Please let us know what you can reasonably afford.",
    ].join("\n")
  }

  return undefined
}

export function partitionDocumentationQuestions(questions: ServiceInquiryQuestionRow[]) {
  const pronounsQuestion =
    questions.find(
      (q) =>
        q.field_type === "text" && normalizeQuestionText(q.question_text) === "pronouns",
    ) ?? null
  const projectQuestions = pronounsQuestion
    ? questions.filter((q) => q.id !== pronounsQuestion.id)
    : questions
  return { pronounsQuestion, projectQuestions }
}

/** @deprecated Use `buildServiceInquiryFieldOrder` with `partitionDocumentationQuestions`. */
export function buildDocumentationInquiryFieldOrder(questions: ServiceInquiryQuestionRow[]) {
  return buildServiceInquiryFieldOrder(questions, partitionDocumentationQuestions)
}
