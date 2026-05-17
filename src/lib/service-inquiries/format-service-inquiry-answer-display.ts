const OTHER_PIPE_PREFIX = "Other|"

function formatSingleStoredValue(value: string): string {
  const t = value.trim()
  if (!t) return "—"
  if (t.startsWith(OTHER_PIPE_PREFIX)) {
    const rest = t.slice(OTHER_PIPE_PREFIX.length).trim()
    return rest ? `Other: ${rest}` : "Other"
  }
  if (t === "Other") return "Other"
  return t
}

/** Parsed multiselect items for PDF bullets; empty array if not multiselect or no values. */
export function parseServiceInquiryMultiselectItems(answerText: string): string[] {
  const raw = answerText.trim()
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => formatSingleStoredValue(String(item)))
      .filter((item) => item !== "—")
  } catch {
    return []
  }
}

/** Human-readable display for stored service inquiry answer_text. */
export function formatServiceInquiryAnswerForDisplay(
  fieldType: string,
  answerText: string,
): string {
  const raw = answerText.trim()
  if (!raw) return "—"

  if (fieldType === "multiselect") {
    const items = parseServiceInquiryMultiselectItems(raw)
    return items.length > 0 ? items.join(", ") : "—"
  }

  return formatSingleStoredValue(raw)
}
