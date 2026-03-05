import { useCallback, useMemo } from "react"
import { UseFormReturn } from "react-hook-form"
import type { EventFormData } from "@/lib/validations/events"
import {
  performanceStep2Schema,
  auditionStep2Schema,
  creativeStep2Schema,
  classStep2Schema,
  fundingStep2Schema,
  DEFAULT_EVENT_ERROR_MESSAGE,
} from "@/lib/validations/events"
import { eventTypeValidationFields } from "@/components/event-forms/event-wizard/validation-config"
import { getEventFieldLabel } from "@/lib/form-helpers"
import { normalizeErrorMessage } from "@/lib/validation-helpers"
import type { EventType } from "@/components/event-forms/event-wizard/EventTypeSelector"

/**
 * Hook for validating event form step 2 based on event type
 * Follows the same pattern as useStepValidation for consistency
 */
export function useEventStepValidation(
  form: UseFormReturn<EventFormData>,
  eventType: EventType
) {
  // Memoize schema based on event type
  const schema = useMemo(() => {
    switch (eventType) {
      case "PERFORMANCE":
        return performanceStep2Schema
      case "AUDITION":
        return auditionStep2Schema
      case "CREATIVE":
        return creativeStep2Schema
      case "CLASS":
        return classStep2Schema
      case "FUNDING":
        return fundingStep2Schema
      default:
        return performanceStep2Schema
    }
  }, [eventType])

  // Memoize fields to validate based on event type
  const fields = useMemo((): (keyof EventFormData)[] => {
    return eventTypeValidationFields[eventType] || []
  }, [eventType])

  const validateStep = useCallback(async (): Promise<boolean> => {
    // Always run schema validation to catch required field errors
    // form.trigger() validates against the full schema where fields might be optional,
    // but step-specific schemas have required fields via superRefine
    const formData = form.getValues()
    const result = schema.safeParse(formData)
    
    if (!result.success) {
      // If schema validation fails, trigger form validation to populate errors
      await form.trigger(fields)
      return false
    }
    
    // Also trigger form validation to ensure field-level errors are shown
    await form.trigger(fields)
    return true
  }, [form, fields, schema])

  const getFirstError = useCallback((): string | null => {
    // Check schema validation first to ensure errors are in the correct order
    // Schema validation runs checks in the order they're written (matching form order)
    const formData = form.getValues()
    const result = schema.safeParse(formData)

    if (!result.success && result.error?.issues) {
      // Find the first error that matches a field in our ordered fields array
      // This ensures errors appear in the same order as the form fields
      for (const field of fields) {
        const matchingIssue = result.error.issues.find(
          (issue) => issue.path[0] === field
        )
        if (matchingIssue) {
          const fieldLabel = getEventFieldLabel(field)
          const errorMessage = matchingIssue.message || ""
          return normalizeErrorMessage(errorMessage, fieldLabel) || `${fieldLabel} is required`
        }
      }
      
      // If no matching field found in ordered array, return first error as fallback
      const firstError = result.error.issues[0]
      const fieldPath = firstError.path[0]
      if (fieldPath) {
        const fieldLabel = getEventFieldLabel(fieldPath as string)
        const errorMessage = firstError.message || ""
        return normalizeErrorMessage(errorMessage, fieldLabel) || `${fieldLabel} is required`
      }
    }

    // Fallback to form errors (react-hook-form validation) in field order
    const errors = form.formState.errors
    for (const field of fields) {
      const error = errors[field]
      if (error) {
        if (typeof error === "object" && "message" in error) {
          const message = error.message as string
          if (message) {
            return normalizeErrorMessage(message, getEventFieldLabel(field))
          }
        }
        // Fallback if error exists but no message
        return `${getEventFieldLabel(field)} is required`
      }
    }

    return null
  }, [form, fields, schema])

  return {
    validateStep,
    getFirstError,
  }
}
