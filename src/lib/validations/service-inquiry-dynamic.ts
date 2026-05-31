import { z } from "zod"
import {
  formatServiceInquiryMultiselectAnswer,
  formatServiceInquirySelectAnswer,
  questionOptionsIncludeOther,
  SERVICE_INQUIRY_OTHER_VALUE,
  type ServiceInquiryQuestionRow,
} from "@/lib/service-inquiries/service-inquiry-questions"
import { isAnswerEmpty } from "@/lib/service-inquiries/validateAnswersAgainstQuestions"

export const SERVICE_INQUIRY_DYNAMIC_ERROR_FALLBACK =
  "Please fix the errors below and try again."

const contactFields = {
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Enter a valid email address"),
}

function isOtherSelected(val: string | string[] | undefined): boolean {
  if (Array.isArray(val)) return val.includes(SERVICE_INQUIRY_OTHER_VALUE)
  return val === SERVICE_INQUIRY_OTHER_VALUE
}

/** Accepts untouched Controller fields (undefined) and normalizes other-text blanks. */
const dynamicAnswerValueSchema = z.preprocess(
  (val) => (val === null || val === undefined ? undefined : val),
  z.union([z.string(), z.array(z.string())]).optional(),
)

const dynamicAnswerOtherValueSchema = z.preprocess(
  (val) => (val == null ? "" : String(val)),
  z.string(),
)

export function buildDynamicServiceInquiryDefaultValues(
  questions: ServiceInquiryQuestionRow[],
): DynamicServiceInquiryFormData {
  const answers: Record<string, string | string[]> = {}
  const answerOther: Record<string, string> = {}

  for (const q of questions) {
    answers[q.id] = q.field_type === "multiselect" ? [] : ""
    answerOther[q.id] = ""
  }

  return {
    firstName: "",
    lastName: "",
    email: "",
    answers,
    answerOther,
  }
}

export function buildDynamicServiceInquirySchema(questions: ServiceInquiryQuestionRow[]) {
  return z
    .object({
      ...contactFields,
      answers: z.record(z.string(), dynamicAnswerValueSchema),
      answerOther: z.record(z.string(), dynamicAnswerOtherValueSchema),
    })
    .superRefine((data, ctx) => {
      for (const q of questions) {
        const val = data.answers[q.id]
        const otherText = data.answerOther[q.id]
        const allowsOther = questionOptionsIncludeOther(q)

        if (allowsOther && isOtherSelected(val) && !otherText?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please describe your selection",
            path: ["answerOther", q.id],
          })
        }

        if (!q.is_required) continue

        let raw: string
        if (q.field_type === "multiselect") {
          const arr = Array.isArray(val) ? val : []
          raw = formatServiceInquiryMultiselectAnswer(arr, otherText)
        } else if (q.field_type === "select") {
          raw = formatServiceInquirySelectAnswer(String(val ?? ""), otherText)
        } else {
          raw = String(val ?? "").trim()
        }

        if (isAnswerEmpty(q.field_type, raw)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${q.question_text} is required`,
            path: ["answers", q.id],
          })
        }
      }
    })
}

export type DynamicServiceInquiryFormData = {
  firstName: string
  lastName: string
  email: string
  answers: Record<string, string | string[]>
  answerOther: Record<string, string>
}

export const dynamicServiceInquiryDefaultValues: DynamicServiceInquiryFormData = {
  firstName: "",
  lastName: "",
  email: "",
  answers: {},
  answerOther: {},
}
