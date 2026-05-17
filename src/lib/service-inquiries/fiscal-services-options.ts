/** Fiscal services slug and field helpers (options live in `service_question_options`). */
export const FISCAL_SERVICES_SERVICE_SLUG = "fiscal-services" as const

export {
  SERVICE_INQUIRY_OTHER_VALUE as FISCAL_SERVICES_OTHER_VALUE,
  type ServiceInquiryQuestionRow as FiscalServicesQuestionRow,
} from "@/lib/service-inquiries/service-inquiry-questions"

import type { ServiceInquiryQuestionRow } from "@/lib/service-inquiries/service-inquiry-questions"

function normalizeQuestionText(text: string) {
  return text.toLowerCase().trim()
}

/** Pronouns in contact section; budget + services + explanation in inquiry section. */
export function partitionFiscalServicesQuestions(questions: ServiceInquiryQuestionRow[]) {
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
