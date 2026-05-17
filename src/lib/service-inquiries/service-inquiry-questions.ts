/** Matches SelectBlock `otherValue` and fiscal sponsorship encoding. */
export const SERVICE_INQUIRY_OTHER_VALUE = "OTHER" as const

const OTHER_PREFIX = "Other|"

export type ServiceInquiryQuestionOption = {
  label: string
  value: string
  order_index: number
  is_other: boolean
}

export type ServiceInquiryQuestionRow = {
  id: string
  question_text: string
  field_type: string
  is_required: boolean
  order_index: number
  options: ServiceInquiryQuestionOption[]
}

export function toSelectOptions(labels: readonly string[]) {
  return labels.map((label) => ({ label, value: label }))
}

/** Options for SelectBlock — excludes literal "Other" when using `allowOther`. */
export function toSelectOptionsForField(labels: readonly string[]) {
  return labels
    .filter((label) => label !== "Other")
    .map((label) => ({ label, value: label }))
}

export function sortedOptionLabels(question: ServiceInquiryQuestionRow): string[] {
  return [...question.options]
    .sort((a, b) => a.order_index - b.order_index)
    .map((o) => o.label)
}

export function questionOptionsIncludeOther(question: ServiceInquiryQuestionRow): boolean {
  return question.options.some((o) => o.is_other || o.label === "Other")
}

/** Single select → answer_text (same pipe format as fiscal sponsorship). */
export function formatServiceInquirySelectAnswer(value: string, otherText?: string): string {
  if (value === SERVICE_INQUIRY_OTHER_VALUE) {
    const t = otherText?.trim()
    return t ? `${OTHER_PREFIX}${t}` : "Other"
  }
  return value
}

/** Multiselect → JSON array string for answer_text. */
export function formatServiceInquiryMultiselectAnswer(
  values: string[],
  otherText?: string,
): string {
  const items = values.filter((v) => v !== SERVICE_INQUIRY_OTHER_VALUE)
  if (values.includes(SERVICE_INQUIRY_OTHER_VALUE)) {
    const t = otherText?.trim()
    items.push(t ? `${OTHER_PREFIX}${t}` : "Other")
  }
  return JSON.stringify(items)
}

export type ServiceInquiryQuestionPartition = {
  pronounsQuestion: ServiceInquiryQuestionRow | null
  projectQuestions: ServiceInquiryQuestionRow[]
}

/** Default: all questions render in the project/details section. */
export function defaultPartitionServiceInquiryQuestions(
  questions: ServiceInquiryQuestionRow[],
): ServiceInquiryQuestionPartition {
  return { pronounsQuestion: null, projectQuestions: questions }
}

/** Validation / error-banner field order for dynamic single-page inquiry forms. */
export function buildServiceInquiryFieldOrder(
  questions: ServiceInquiryQuestionRow[],
  partitionQuestions: (
    questions: ServiceInquiryQuestionRow[],
  ) => ServiceInquiryQuestionPartition = defaultPartitionServiceInquiryQuestions,
): string[] {
  const { pronounsQuestion, projectQuestions } = partitionQuestions(questions)
  const order: string[] = ["firstName", "lastName", "email"]
  if (pronounsQuestion) {
    order.push(`answers.${pronounsQuestion.id}`)
  }
  for (const q of projectQuestions) {
    order.push(`answerOther.${q.id}`, `answers.${q.id}`)
  }
  return order
}
