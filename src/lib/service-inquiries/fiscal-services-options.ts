/** Fiscal services slug and field helpers (options live in `service_question_options`). */
export const FISCAL_SERVICES_SERVICE_SLUG = "fiscal-services" as const

/** Matches `service_questions.question_text` after migration `20260531140000`. */
export const FISCAL_SERVICES_COMPREHENSIVE_QUESTION =
  "What comprehensive fiscal services are you interested in?" as const

/** Matches `service_questions.question_text` after migration `20260531140000`. */
export const FISCAL_SERVICES_HOURLY_QUESTION =
  "What hourly fiscal services are you interested in?" as const

export {
  SERVICE_INQUIRY_OTHER_VALUE as FISCAL_SERVICES_OTHER_VALUE,
  type ServiceInquiryQuestionRow as FiscalServicesQuestionRow,
} from "@/lib/service-inquiries/service-inquiry-questions"

import type { ServiceInquiryQuestionRow } from "@/lib/service-inquiries/service-inquiry-questions"

function normalizeQuestionText(text: string) {
  return text.toLowerCase().trim()
}

/** Helper copy shown under specific fiscal services inquiry fields. */
export function fiscalServicesQuestionNote(questionText: string): string | undefined {
  const key = normalizeQuestionText(questionText)

  if (key === normalizeQuestionText(FISCAL_SERVICES_COMPREHENSIVE_QUESTION)) {
    return "Select all comprehensive programs that apply."
  }

  if (key === normalizeQuestionText(FISCAL_SERVICES_HOURLY_QUESTION)) {
    return "Select the hourly bookkeeping and reporting services you need."
  }

  return undefined
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
