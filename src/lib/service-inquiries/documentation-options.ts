/** Hardcoded options for the Documentation service form (no `question_options` table yet). */
export const DOCUMENTATION_SERVICE_SLUG = "documentation" as const

export const DOCUMENTATION_SERVICE_TYPE_OPTIONS = [
  "Photography",
  "Videography",
  "Package",
  "Other",
] as const

export const DOCUMENTATION_PROJECT_TYPE_OPTIONS = [
  "Performance",
  "Rehearsal",
  "Event",
  "Other",
] as const

export function selectOptionsForQuestion(questionText: string, fieldType: string): readonly string[] {
  if (fieldType === "multiselect") return DOCUMENTATION_SERVICE_TYPE_OPTIONS
  if (fieldType === "select" && questionText.toLowerCase().includes("project")) {
    return DOCUMENTATION_PROJECT_TYPE_OPTIONS
  }
  if (fieldType === "select") return DOCUMENTATION_SERVICE_TYPE_OPTIONS
  return []
}
