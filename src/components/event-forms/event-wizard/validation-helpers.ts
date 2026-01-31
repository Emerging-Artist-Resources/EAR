import { UseFormReturn } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { EventType } from "./EventTypeSelector"
import { eventTypeValidationFields } from "./validation-config"

export async function validateStep2(
  form: UseFormReturn<EventFormData>,
  eventType: EventType
): Promise<{ isValid: boolean; message?: string }> {
  const fields = eventTypeValidationFields[eventType]
  if (!fields || fields.length === 0) {
    return { isValid: true }
  }

  // Type assertion needed for react-hook-form's trigger method
  const isValid = await form.trigger(fields as (keyof EventFormData)[], { shouldFocus: true })
  if (!isValid) {
    return { isValid: false, message: "Please complete required fields on this step" }
  }

  // Type-specific additional validations
  if (eventType === "PERFORMANCE") {
    const extras = (form.getValues().extraOccurrences ?? []) as Array<{
      date?: string
      times?: Array<{ time?: string }>
    }>
    const hasOne = Array.isArray(extras) &&
      extras.some(
        (d) =>
          d?.date &&
          Array.isArray(d?.times) &&
          d.times.some((t) => t?.time)
      )
    if (!hasOne) {
      return { isValid: false, message: "Please add at least one date & time" }
    }
  }

  if (eventType === "CLASS") {
    const classDates = form.getValues("classDates")
    const extraOcc = form.getValues("classExtraOccurrences") ?? []
    const hasDates = classDates || (Array.isArray(extraOcc) && extraOcc.length > 0)
    if (!hasDates) {
      return { isValid: false, message: "Please provide at least one valid class date/time" }
    }
  }

  if (eventType === "AUDITION") {
    const occurrences = (form.getValues("occurrences") ?? []) as Array<{
      date?: string
      times?: Array<{ time?: string }>
    }>
    const deadlineOccurrences = (form.getValues("deadlineOccurrences") ?? []) as Array<{
      date?: string
      times?: Array<{ time?: string }>
    }>
    
    const hasOccurrences = Array.isArray(occurrences) &&
      occurrences.some(
        (d) =>
          d?.date && d.date.trim() !== "" &&
          Array.isArray(d?.times) &&
          d.times.some((t) => t?.time && t.time.trim() !== "")
      )
    
    const hasDeadlineOccurrences = Array.isArray(deadlineOccurrences) &&
      deadlineOccurrences.some(
        (d) =>
          d?.date && d.date.trim() !== "" &&
          Array.isArray(d?.times) &&
          d.times.some((t) => t?.time && t.time.trim() !== "")
      )
    
    if (!hasOccurrences) {
      return { isValid: false, message: "Please add at least one audition date & time" }
    }
    if (!hasDeadlineOccurrences) {
      return { isValid: false, message: "Please add at least one deadline date & time" }
    }
  }

  return { isValid: true }
}

