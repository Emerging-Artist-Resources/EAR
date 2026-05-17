import type { FieldError, FieldErrors } from "react-hook-form"

/** Read a nested react-hook-form error by dot path (e.g. `answers.uuid`). */
export function getFieldErrorAtPath(
  errors: FieldErrors,
  path: string,
): FieldError | undefined {
  const parts = path.split(".")
  let current: unknown = errors
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[part]
  }
  if (current && typeof current === "object" && "message" in current) {
    return current as FieldError
  }
  return undefined
}

export function hasFieldErrorAtPath(errors: FieldErrors, path: string): boolean {
  return getFieldErrorAtPath(errors, path) != null
}

export function hasErrorsInFieldOrder(
  errors: FieldErrors,
  fieldOrder: readonly string[],
): boolean {
  return fieldOrder.some((path) => hasFieldErrorAtPath(errors, path))
}
