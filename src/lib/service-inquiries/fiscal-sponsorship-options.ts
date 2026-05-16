/**
 * Fiscal sponsorship inquiry — select/multiselect options and answer encoding.
 *
 * "Other" answers use pipe format: `Other|{freeText}` in answer_text (single select)
 * or inside JSON arrays for multiselect. Documentation service is unchanged.
 */

export const FISCAL_SPONSORSHIP_SERVICE_SLUG = "fiscal-sponsorship" as const

export const FISCAL_SPONSORSHIP_OTHER_VALUE = "OTHER" as const

const OTHER_PREFIX = "Other|"

export const ENTITY_TYPE_OPTIONS = [
  "Independent Artist",
  "Artist Collective",
  "Artist Organization",
  "Nonprofit (501c3 Status)",
] as const

export const ARTISTIC_DISCIPLINE_OPTIONS = [
  "Dance",
  "Theater",
  "Music",
  "Performance Art",
  "Interdisciplinary",
  "Film/Media",
  "Visual Art",
] as const

export const ANNUAL_BUDGET_OPTIONS = [
  "Under $10,000",
  "$10,000 - $50,000",
  "$50,000 - $150,000",
  "$150,000+",
  "Not sure yet",
] as const

export const WHY_SEEKING_OPTIONS = [
  "Apply for grants requiring a nonprofit",
  "Receive tax-deductible donations",
  "Administrative/financial infrastructure",
  "Financial oversight",
  "Grant management",
] as const

export const EXPECTED_SERVICES_OPTIONS = [
  "Grant fund management",
  "Donation processing",
  "Financial reporting",
  "Contract management",
  "Budget development",
  "Fiscal Mentorship",
  "Bookkeeping services",
] as const

export const LEGAL_ENTITY_OPTIONS = [
  "No legal entity",
  "LLC",
  "Nonprofit (not yet 501c3)",
  "501(c)(3)",
] as const

export const YES_NO_OPTIONS = ["Yes", "No"] as const

export const ADDITIONAL_SERVICES_INTEREST_OPTIONS = ["Yes", "No", "Maybe"] as const

export const HOW_HEARD_OPTIONS = [
  "Word of mouth",
  "Website",
  "Social Media",
  "Artist Network",
] as const

export function toSelectOptions(labels: readonly string[]) {
  return labels.map((label) => ({ label, value: label }))
}

/** Single select → answer_text */
export function formatSelectAnswer(value: string, otherText?: string): string {
  if (value === FISCAL_SPONSORSHIP_OTHER_VALUE) {
    const t = otherText?.trim()
    return t ? `${OTHER_PREFIX}${t}` : "Other"
  }
  return value
}

/** Multiselect → JSON array string for answer_text */
export function formatMultiselectAnswer(values: string[], otherText?: string): string {
  const items = values.filter((v) => v !== FISCAL_SPONSORSHIP_OTHER_VALUE)
  if (values.includes(FISCAL_SPONSORSHIP_OTHER_VALUE)) {
    const t = otherText?.trim()
    items.push(t ? `${OTHER_PREFIX}${t}` : "Other")
  }
  return JSON.stringify(items)
}
