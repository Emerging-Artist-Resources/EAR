import { useCallback, useMemo } from "react"
import { UseFormReturn } from "react-hook-form"
import type { SignupFormData } from "@/lib/validations/signup"
import {
  basicInfoSchema,
  eligibilitySchema,
  wrapUpSchema,
  passwordSchema,
  SIGNUP_STEPS,
} from "@/lib/validations/signup"
import { getFieldLabel } from "@/lib/form-helpers"
import { normalizeErrorMessage } from "@/lib/validation-helpers"

type Step = 1 | 2 | 3 | 4

export function useStepValidation(
  form: UseFormReturn<SignupFormData>,
  step: Step
) {
  // Memoize schema and fields to avoid recalculation
  const schema = useMemo(() => {
    switch (step) {
      case SIGNUP_STEPS.BASIC:
        return basicInfoSchema
      case SIGNUP_STEPS.ELIGIBILITY:
        return eligibilitySchema
      case SIGNUP_STEPS.WRAP_UP:
        return wrapUpSchema
      case SIGNUP_STEPS.PASSWORD:
        return passwordSchema
      default:
        return basicInfoSchema
    }
  }, [step])

  const fields = useMemo((): (keyof SignupFormData)[] => {
    switch (step) {
      case SIGNUP_STEPS.BASIC:
        return ["profile_type", "name", "email"]
      case SIGNUP_STEPS.ELIGIBILITY:
        return [
          "self_identifies_emerging",
          "operating_budget_range",
          "operating_budget_other_text",
          "owns_or_operates_venue",
          "owns_or_operates_venue_other_text",
          "supported_by_major_institution",
          "supported_by_major_institution_other_text",
          "classes_hosted_independently",
          "classes_hosted_independently_other_text",
          "has_501c3",
          "has_501c3_other_text",
        ]
      case SIGNUP_STEPS.WRAP_UP:
        return [
          "referral_source",
          "referral_source_other",
          "newsletter_ear_opt_in",
          "newsletter_calendar_opt_in",
        ]
      case SIGNUP_STEPS.PASSWORD:
        return ["password", "confirmPassword"]
      default:
        return []
    }
  }, [step])

  const validateStep = useCallback(async (): Promise<boolean> => {
    const isValid = await form.trigger(fields)

    // Also validate against the schema to catch refine errors
    if (isValid) {
      const formData = form.getValues()
      const result = schema.safeParse(formData)
      return result.success
    }

    return isValid
  }, [form, fields, schema])

  const getFirstError = useCallback((): string | null => {
    const errors = form.formState.errors

    // Check form errors first (react-hook-form validation)
    for (const field of fields) {
      const error = errors[field]
      if (error) {
        if (typeof error === "object" && "message" in error) {
          const message = error.message as string
          if (message) {
            return normalizeErrorMessage(message, getFieldLabel(field))
          }
        }
        // Fallback if error exists but no message
        return `${getFieldLabel(field)} is required`
      }
    }

    // Fallback to schema validation if no form errors found
    const formData = form.getValues()
    const result = schema.safeParse(formData)

    if (!result.success && result.error?.issues[0]) {
      const firstError = result.error.issues[0]
      const fieldPath = firstError.path[0]
      if (fieldPath) {
        const fieldLabel = getFieldLabel(fieldPath as string)
        const errorMessage = firstError.message || ""
        return normalizeErrorMessage(errorMessage, fieldLabel) || `${fieldLabel} is required`
      }
    }

    return null
  }, [form, fields, schema])

  return {
    validateStep,
    getFirstError,
  }
}
