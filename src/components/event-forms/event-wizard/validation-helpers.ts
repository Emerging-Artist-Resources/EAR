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

  // For CLASS type, check if classOccurrences is being used (for multi-day events)
  // If so, we'll validate it separately instead of requiring occurrences
  let fieldsToValidate = fields
  if (eventType === "CLASS") {
    const classOccurrences = form.getValues("classOccurrences") as Array<{
      date?: string
      times?: Array<{ time?: string }>
    }> | undefined
    
    const hasClassOccurrences = Array.isArray(classOccurrences) &&
      classOccurrences.some(
        (d) =>
          d?.date && d.date.trim() !== "" &&
          Array.isArray(d?.times) &&
          d.times.some((t) => t?.time && t.time.trim() !== "")
      )
    
    // If classOccurrences has data, remove occurrences from required fields
    // (ClassOccurrencesPicker uses classOccurrences for multi-day events)
    if (hasClassOccurrences) {
      fieldsToValidate = fields.filter(f => f !== "occurrences") as Array<keyof EventFormData>
      fieldsToValidate.push("classOccurrences" as keyof EventFormData)
    }
  }

  // Type assertion needed for react-hook-form's trigger method
  const isValid = await form.trigger(fieldsToValidate as (keyof EventFormData)[], { shouldFocus: true })
  if (!isValid) {
    return { isValid: false, message: "Please complete required fields on this step" }
  }

  // Type-specific additional validations
  if (eventType === "PERFORMANCE") {
    // Check new canonical occurrences field (preferred)
    const occurrences = (form.getValues("occurrences") ?? []) as Array<{
      date?: string
      times?: Array<{ time?: string }>
    }>
    
    // Check legacy extraOccurrences field (for backwards compatibility)
    const extras = (form.getValues().extraOccurrences ?? []) as Array<{
      date?: string
      times?: Array<{ time?: string }>
    }>
    
    // Validate new occurrences format
    const hasNewOccurrences = Array.isArray(occurrences) &&
      occurrences.some(
        (d) =>
          d?.date && d.date.trim() !== "" &&
          Array.isArray(d?.times) &&
          d.times.some((t) => t?.time && t.time.trim() !== "")
      )
    
    // Validate legacy extraOccurrences format
    const hasLegacyOccurrences = Array.isArray(extras) &&
      extras.some(
        (d) =>
          d?.date && d.date.trim() !== "" &&
          Array.isArray(d?.times) &&
          d.times.some((t) => t?.time && t.time.trim() !== "")
      )
    
    if (!hasNewOccurrences && !hasLegacyOccurrences) {
      return { isValid: false, message: "Please add at least one date & time" }
    }
  }

  if (eventType === "CLASS") {
    // Check new canonical occurrences field
    const occurrences = (form.getValues("occurrences") ?? []) as Array<{
      date?: string
      times?: Array<{ time?: string }>
    }>
    
    // Check classOccurrences (used by ClassOccurrencesPicker for multi-day events)
    const classOccurrences = (form.getValues("classOccurrences") ?? []) as Array<{
      date?: string
      times?: Array<{ time?: string }>
    }>
    
    // Check legacy fields for backwards compatibility
    const classDates = form.getValues("classDates")
    const extraOcc = form.getValues("classExtraOccurrences") ?? []
    
    // Validate new occurrences format
    const hasNewOccurrences = Array.isArray(occurrences) &&
      occurrences.some(
        (d) =>
          d?.date && d.date.trim() !== "" &&
          Array.isArray(d?.times) &&
          d.times.some((t) => t?.time && t.time.trim() !== "")
      )
    
    // Validate classOccurrences format (used by ClassOccurrencesPicker)
    const hasClassOccurrences = Array.isArray(classOccurrences) &&
      classOccurrences.some(
        (d) =>
          d?.date && d.date.trim() !== "" &&
          Array.isArray(d?.times) &&
          d.times.some((t) => t?.time && t.time.trim() !== "")
      )
    
    // Check legacy fields
    const hasLegacyDates = classDates || (Array.isArray(extraOcc) && extraOcc.length > 0)
    
    if (!hasNewOccurrences && !hasClassOccurrences && !hasLegacyDates) {
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

