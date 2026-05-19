/** True when a string field has non-whitespace content suitable for public display. */
export function hasDisplayText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0
}
