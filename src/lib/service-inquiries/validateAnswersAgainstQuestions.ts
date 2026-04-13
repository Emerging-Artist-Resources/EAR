export type ServiceQuestionRow = {
  id: string
  field_type: string
  is_required: boolean
}

/**
 * Determines whether a submitted answer is empty for the given field type.
 * Multiselect values are JSON arrays in `answer_text`.
 */
export function isAnswerEmpty(fieldType: string, raw: string | undefined): boolean {
  if (raw === undefined) return true
  const t = raw.trim()
  if (t === "") return true
  if (fieldType === "multiselect") {
    try {
      const parsed: unknown = JSON.parse(t)
      if (!Array.isArray(parsed)) return true
      return parsed.length === 0
    } catch {
      return true
    }
  }
  return false
}

/**
 * Returns an error message if validation fails, otherwise null.
 */
export function validateAnswersAgainstQuestions(
  questions: ServiceQuestionRow[],
  answersByQuestionId: Map<string, string>,
): string | null {
  const allowed = new Set(questions.map((q) => q.id))

  for (const qid of answersByQuestionId.keys()) {
    if (!allowed.has(qid)) {
      return "One or more questions are not valid for this service"
    }
  }

  for (const q of questions) {
    if (!q.is_required) continue
    const raw = answersByQuestionId.get(q.id)
    if (isAnswerEmpty(q.field_type, raw)) {
      return "Please answer all required questions"
    }
  }

  return null
}
