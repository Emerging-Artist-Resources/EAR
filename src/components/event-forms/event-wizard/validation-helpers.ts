import { UseFormReturn } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"
import { EventType } from "./EventTypeSelector"
import { eventTypeValidationFields } from "./validation-config"

export async function validateStep2(
  form: UseFormReturn<EventFormData>,
  eventType: EventType
): Promise<{ isValid: boolean; message?: string }> {
  console.log("[validateStep2] Starting validation for eventType:", eventType)
  const fields = eventTypeValidationFields[eventType]
  console.log("[validateStep2] Fields to validate:", fields)
  if (!fields || fields.length === 0) {
    console.log("[validateStep2] No fields to validate, returning valid")
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

  // For PERFORMANCE type, check if it's a PIECE submission
  // For PIECE submissions, we validate occurrences/extraOccurrences/selectedSlots in custom validation
  // So we remove occurrences from the form.trigger validation to avoid schema errors
  if (eventType === "PERFORMANCE") {
    const perfType = form.getValues("type") as "ORGANIZER" | "PIECE" | undefined
    const scheduleMode = form.getValues("pieceScheduleMode") as "FROM_PARENT" | "CUSTOM" | undefined
    
    console.log("[validateStep2] Performance type:", perfType, "Schedule mode:", scheduleMode)
    
    if (perfType === "PIECE") {
      // For PIECE submissions (both FROM_PARENT and CUSTOM), remove occurrences from validation
      // We'll validate selectedSlots (FROM_PARENT) or extraOccurrences (CUSTOM) in custom validation
      console.log("[validateStep2] PIECE submission - removing occurrences from validation (will validate in custom logic)")
      fieldsToValidate = fields.filter(f => f !== "occurrences") as Array<keyof EventFormData>
    }
  }

  console.log("[validateStep2] Final fields to validate:", fieldsToValidate)
  // Type assertion needed for react-hook-form's trigger method
  const isValid = await form.trigger(fieldsToValidate as (keyof EventFormData)[], { shouldFocus: true })
  console.log("[validateStep2] Form trigger result:", isValid)
  if (!isValid) {
    const errors = form.formState.errors
    console.log("[validateStep2] Form errors:", errors)
    return { isValid: false, message: "Please complete required fields on this step" }
  }

  // Type-specific additional validations
  if (eventType === "PERFORMANCE") {
    console.log("[validateStep2] PERFORMANCE type validation")
    const perfType = form.getValues("type") as "ORGANIZER" | "PIECE" | undefined
    console.log("[validateStep2] Performance type:", perfType)
    
    if (perfType === "PIECE") {
      console.log("[validateStep2] PIECE submission detected")
      // For PIECE submissions, check schedule mode
      const scheduleMode = form.getValues("pieceScheduleMode") as "FROM_PARENT" | "CUSTOM" | undefined
      console.log("[validateStep2] Schedule mode:", scheduleMode)
      
      // Check if user has custom occurrences (even if in FROM_PARENT mode, they might have added custom dates)
      const extras = (form.getValues("extraOccurrences") ?? []) as Array<{
        date?: string
        times?: Array<{ time?: string }>
      }>
      
      const hasCustomOccurrences = Array.isArray(extras) &&
        extras.length > 0 &&
        extras.some(
          (d) =>
            d?.date && d.date.trim() !== "" &&
            Array.isArray(d?.times) &&
            d.times.length > 0 &&
            d.times.some((t) => t?.time && t.time.trim() !== "")
        )
      
      console.log("[validateStep2] Has custom occurrences:", hasCustomOccurrences, "extras:", JSON.stringify(extras, null, 2))
      
      // If user has custom occurrences, validate those (even if in FROM_PARENT mode)
      if (hasCustomOccurrences) {
        console.log("[validateStep2] Custom occurrences found - validating those")
        console.log("[validateStep2] Custom occurrences validation passed")
      } else if (scheduleMode === "FROM_PARENT") {
        // If selecting from parent and no custom occurrences, require selectedSlots
        const selectedSlots = form.getValues("selectedSlots") as string[] | undefined
        console.log("[validateStep2] Selected slots:", selectedSlots)
        if (!selectedSlots || selectedSlots.length === 0) {
          console.log("[validateStep2] Validation failed: No selectedSlots")
          return { isValid: false, message: "Select at least one date/time from the event schedule" }
        }
        console.log("[validateStep2] Selected slots validation passed")
      } else {
        // CUSTOM mode - check occurrences or extraOccurrences
        console.log("[validateStep2] CUSTOM mode - checking occurrences")
        const occurrences = (form.getValues("occurrences") ?? []) as Array<{
          date?: string
          times?: Array<{ time?: string }>
        }>
        
        console.log("[validateStep2] Occurrences:", JSON.stringify(occurrences, null, 2))
        
        const hasNewOccurrences = Array.isArray(occurrences) &&
          occurrences.length > 0 &&
          occurrences.some(
            (d) =>
              d?.date && d.date.trim() !== "" &&
              Array.isArray(d?.times) &&
              d.times.length > 0 &&
              d.times.some((t) => t?.time && t.time.trim() !== "")
          )
        
        console.log("[validateStep2] Has new occurrences:", hasNewOccurrences, "array length:", occurrences?.length)
        
        if (!hasNewOccurrences && !hasCustomOccurrences) {
          console.log("[validateStep2] Validation failed: No occurrences found")
          return { isValid: false, message: "Add at least one date & time for your piece" }
        }
        console.log("[validateStep2] Custom occurrences validation passed")
      }
    } else {
      console.log("[validateStep2] ORGANIZER submission - checking occurrences")
      // For ORGANIZER submissions, check occurrences or extraOccurrences
      const occurrences = (form.getValues("occurrences") ?? []) as Array<{
        date?: string
        times?: Array<{ time?: string }>
      }>
      
      const extras = (form.getValues("extraOccurrences") ?? []) as Array<{
        date?: string
        times?: Array<{ time?: string }>
      }>
      
      console.log("[validateStep2] Occurrences:", occurrences)
      console.log("[validateStep2] ExtraOccurrences:", extras)
      
      const hasNewOccurrences = Array.isArray(occurrences) &&
        occurrences.some(
          (d) =>
            d?.date && d.date.trim() !== "" &&
            Array.isArray(d?.times) &&
            d.times.some((t) => t?.time && t.time.trim() !== "")
        )
      
      const hasLegacyOccurrences = Array.isArray(extras) &&
        extras.some(
          (d) =>
            d?.date && d.date.trim() !== "" &&
            Array.isArray(d?.times) &&
            d.times.some((t) => t?.time && t.time.trim() !== "")
        )
      
      console.log("[validateStep2] Has new occurrences:", hasNewOccurrences)
      console.log("[validateStep2] Has legacy occurrences:", hasLegacyOccurrences)
      
      if (!hasNewOccurrences && !hasLegacyOccurrences) {
        console.log("[validateStep2] Validation failed: No occurrences found")
        return { isValid: false, message: "Please add at least one date & time" }
      }
      console.log("[validateStep2] Organizer occurrences validation passed")
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

  console.log("[validateStep2] All validations passed")
  return { isValid: true }
}

