import { UseFormReturn } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { EventType } from "./EventTypeSelector"
import { DEFAULT_EVENT_ERROR_MESSAGE } from "@/lib/validations/events"

/**
 * Thin wrapper for backward compatibility
 * Uses hook's validateStep and getFirstError functions
 */
export async function validateStep2(
  _form: UseFormReturn<EventFormData>,
  _eventType: EventType,
  validateStep: () => Promise<boolean>,
  getFirstError: () => string | null
): Promise<{ isValid: boolean; message?: string }> {
  const isValid = await validateStep()
  if (!isValid) {
    const errorMessage = getFirstError() || DEFAULT_EVENT_ERROR_MESSAGE
    return { isValid: false, message: errorMessage }
  }
  return { isValid: true }
}

