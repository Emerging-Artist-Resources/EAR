import { useCallback, useMemo } from "react"
import type { FieldValues, Path, UseFormReturn } from "react-hook-form"
import type { ZodTypeAny } from "zod"
import {
  getFieldErrorAtPath,
  hasErrorsInFieldOrder,
} from "@/lib/service-inquiries/form-error-path"
import { normalizeErrorMessage } from "@/lib/forms/validation-helpers"

type UseServiceInquiryFormErrorsOptions = {
  /** Field paths in display order (supports dot paths, e.g. `answers.${questionId}`). */
  fieldOrder: readonly string[]
  fallbackMessage: string
  /** When set, used for a message if no field-level error is found but parse still fails. */
  schema?: ZodTypeAny
  /** Optional human label for `normalizeErrorMessage` (multi-step / static forms). */
  labelFor?: (fieldPath: string) => string
  /** Keys on `formState.errors` that indicate nested dynamic answers (e.g. `answers`, `answerOther`). */
  nestedErrorRoots?: readonly string[]
}

export function useServiceInquiryFormErrors<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  options: UseServiceInquiryFormErrorsOptions,
) {
  const { fieldOrder, fallbackMessage, schema, labelFor, nestedErrorRoots } = options

  const getFirstError = useCallback((): string | null => {
    const errors = form.formState.errors

    for (const path of fieldOrder) {
      const error = getFieldErrorAtPath(errors, path)
      if (error?.message) {
        const message = String(error.message)
        return labelFor ? normalizeErrorMessage(message, labelFor(path)) : message
      }
      if (error) {
        return labelFor
          ? `${labelFor(path)} is required`
          : fallbackMessage
      }
    }

    if (schema) {
      const parsed = schema.safeParse(form.getValues())
      if (!parsed.success && parsed.error.issues[0]) {
        const issue = parsed.error.issues[0]
        const pathKey = issue.path.length > 0 ? String(issue.path[0]) : undefined
        if (pathKey && labelFor) {
          return (
            normalizeErrorMessage(issue.message || "", labelFor(pathKey)) ||
            `${labelFor(pathKey)} is required`
          )
        }
        return issue.message || fallbackMessage
      }
    }

    return null
  }, [form, fieldOrder, schema, labelFor, fallbackMessage])

  const getFirstInvalidFieldName = useCallback((): string | null => {
    for (const path of fieldOrder) {
      if (form.getFieldState(path as Path<TFieldValues>).invalid) {
        return path
      }
    }
    return null
  }, [form, fieldOrder])

  const hasErrors = useMemo(() => {
    const errors = form.formState.errors
    if (hasErrorsInFieldOrder(errors, fieldOrder)) return true
    if (
      nestedErrorRoots?.some((key) => {
        const nested = (errors as Record<string, unknown>)[key]
        return nested != null && typeof nested === "object" && Object.keys(nested).length > 0
      })
    ) {
      return true
    }
    return false
  }, [form.formState.errors, fieldOrder, nestedErrorRoots])

  const resolveErrorMessage = useCallback(
    (): string => getFirstError() ?? fallbackMessage,
    [getFirstError, fallbackMessage],
  )

  const focusFirstInvalid = useCallback(() => {
    const firstInvalid = getFirstInvalidFieldName()
    if (firstInvalid) {
      void form.setFocus(firstInvalid as Path<TFieldValues>)
    }
  }, [form, getFirstInvalidFieldName])

  const reportValidationFailure = useCallback(
    (setShowErrorSummary: (show: boolean) => void, showToast: (message: string, type: "error") => void) => {
      setShowErrorSummary(true)
      showToast(resolveErrorMessage(), "error")
      focusFirstInvalid()
    },
    [resolveErrorMessage, focusFirstInvalid],
  )

  return {
    getFirstError,
    getFirstInvalidFieldName,
    hasErrors,
    resolveErrorMessage,
    focusFirstInvalid,
    reportValidationFailure,
  }
}
