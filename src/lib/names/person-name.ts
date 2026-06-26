/**
 * Derives a greeting name from a full person name.
 * Multi-word: first token. Single word: full name. Missing/blank: "there".
 */
export function greetingNameFromFullName(
  fullName: string | null | undefined,
): string {
  const trimmed = fullName?.trim() ?? ""
  if (!trimmed) return "there"

  const space = trimmed.indexOf(" ")
  if (space === -1) return trimmed

  const first = trimmed.slice(0, space).trim()
  return first || trimmed || "there"
}
