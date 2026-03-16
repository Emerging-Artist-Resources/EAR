import { useCallback, useMemo } from "react"
import { UseFormReturn } from "react-hook-form"
import type { EventFormData } from "@/lib/validations/events"
import { getStep2Schema } from "@/lib/validations/events/step-schemas"
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
  // Memoize fields to validate based on event type
  const fields = useMemo((): (keyof EventFormData)[] => {
    return eventTypeValidationFields[eventType] || []
  }, [eventType])

  // Use existing step-specific schema (handles multi-flow forms)
  const step2Schema = useMemo(() => {
    return getStep2Schema(eventType)
  }, [eventType])

  const validateStep = useCallback(async (): Promise<boolean> => {
    // Explicit check for PERFORMANCE type field before schema validation
    // This ensures the error is caught early and set on form state immediately
    if (eventType === "PERFORMANCE") {
      const formData = form.getValues()
      const typeValue = formData.type
      if (!typeValue || (typeValue !== "ORGANIZER" && typeValue !== "PIECE")) {
        form.setError("type", {
          type: "manual",
          message: "Please select what you are submitting",
        })
        return false
      }
    }

    // Use step-specific schema instead of full schema + filtering
    const formData = form.getValues()
    const result = step2Schema.safeParse(formData)
    
    if (!result.success) {
      // Map schema errors to form errors
      result.error.issues.forEach((error) => {
        // Handle nested paths (e.g., ['occurrences', 0, 'address'])
        // Convert to React Hook Form path format
        const pathParts = error.path.map((p) => String(p))
        const path = pathParts.join('.') as any
        form.setError(path, {
          type: 'manual',
          message: error.message,
        })
      })
      return false
    }

    return true
  }, [form, eventType, step2Schema])

  const getFirstError = useCallback((): string | null => {
    // Use step-specific schema instead of full schema
    const formData = form.getValues()
    const result = step2Schema.safeParse(formData)
    
    if (!result.success && result.error?.issues) {
      // Find first error in field order
      for (const field of fields) {
        const matchingIssue = result.error.issues.find((issue) => {
          const issuePath = issue.path[0]
          const fieldStr = String(field)
          const issuePathStr = String(issuePath)
          return issuePathStr === fieldStr || issuePathStr.startsWith(fieldStr)
        })
        if (matchingIssue) {
          const fieldLabel = getEventFieldLabel(field)
          const errorMessage = matchingIssue.message || ""
          return normalizeErrorMessage(errorMessage, fieldLabel) || 
                 `${fieldLabel} is required`
        }
      }
    }

    // Fallback to form state errors if schema validation passed
    // Use RHF's error state directly - zodResolver already mapped errors correctly
    // Check errors in field order to match form field order
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

    // Check for nested array errors (e.g., occurrences.0.address)
    // These are stored in form.formState.errors but may not match top-level field names
    const errorKeys = Object.keys(errors)
    for (const field of fields) {
      // Check if any error key starts with this field (for nested errors)
      const matchingErrorKey = errorKeys.find(key => key.startsWith(field as string))
      if (matchingErrorKey) {
        const error = errors[matchingErrorKey as keyof typeof errors]
        if (error && typeof error === "object" && "message" in error) {
          const message = error.message as string
          if (message) {
            return normalizeErrorMessage(message, getEventFieldLabel(field))
          }
        }
      }
    }

    return null
  }, [form.formState.errors, form, fields, step2Schema])

  return {
    validateStep,
    getFirstError,
  }
}
