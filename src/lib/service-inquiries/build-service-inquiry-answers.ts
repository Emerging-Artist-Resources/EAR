import {
  formatServiceInquiryMultiselectAnswer,
  formatServiceInquirySelectAnswer,
  type ServiceInquiryQuestionRow,
} from "@/lib/service-inquiries/service-inquiry-questions"
import type { DynamicServiceInquiryFormData } from "@/lib/validations/service-inquiry-dynamic"

export type ServiceAnswerPayload = {
  question_id: string
  answer_text: string
}

/**
 * Build API answers from form values. Uses `Other|{text}` encoding for select/multiselect
 * (same convention as fiscal sponsorship — stored in `service_answers.answer_text`).
 */
export function buildServiceInquiryAnswers(
  data: DynamicServiceInquiryFormData,
  questions: ServiceInquiryQuestionRow[],
): ServiceAnswerPayload[] {
  return questions.map((q) => {
    const val = data.answers[q.id]
    const otherText = data.answerOther[q.id]

    if (q.field_type === "multiselect") {
      const arr = Array.isArray(val) ? val : []
      return {
        question_id: q.id,
        answer_text: formatServiceInquiryMultiselectAnswer(arr, otherText),
      }
    }

    if (q.field_type === "select") {
      return {
        question_id: q.id,
        answer_text: formatServiceInquirySelectAnswer(String(val ?? ""), otherText),
      }
    }

    return {
      question_id: q.id,
      answer_text: String(val ?? "").trim(),
    }
  })
}
