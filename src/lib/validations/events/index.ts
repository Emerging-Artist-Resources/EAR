import { z } from "zod"
import { baseSchema, occurrenceSchema, occurrencesSchema, extraDateSchema, extraTimeSchema } from "./base"
import { performanceFields } from "./performance"
import { auditionFields } from "./audition"
import { creativeFields } from "./creative"
import { classFields } from "./class"

export const eventFormSchema = baseSchema
  .merge(performanceFields)
  .merge(auditionFields)
  .merge(creativeFields)
  .merge(classFields)
  .superRefine((data, ctx) => {
    // Address validation depends on event type:
    // - Auditions/Creative: base address is required (single location for all occurrences)
    // - Performance/Class: base address is optional (locations are per-occurrence via locationConfig)
    
    const hasDeadlineOccurrences = !!(data.deadlineOccurrences && Array.isArray(data.deadlineOccurrences) && data.deadlineOccurrences.length > 0)
    const hasAuditionFields = !!(data.eligibility && data.instructions)
    const hasCreativeFields = !!(data.host && data.dates && data.requirements && data.link)
    const isAudition = hasDeadlineOccurrences && hasAuditionFields && !hasCreativeFields && !data.type
    const isCreative = hasDeadlineOccurrences && hasCreativeFields && !data.type
    
    // Only require base address for auditions and creative opportunities
    // (Performance and class use per-occurrence locations)
    if ((isAudition || isCreative) && (!data.address || data.address.trim() === "")) {
      ctx.addIssue({
        code: "custom",
        path: ["address"],
        message: "Address is required",
      })
    }
    
    // Only validate extraOccurrences for PERFORMANCE type (legacy field)
    // For other types (auditions, creative, classes), this field should be ignored
    const isPerformance = data.type === "ORGANIZER" || data.type === "PIECE"
    
    if (!isPerformance) {
      // For non-performance types, don't validate extraOccurrences
      // This prevents validation errors for auditions, classes, creative opportunities, etc.
      return
    }
    
    // For performance types, validate extraOccurrences only if it has items
    if (data.extraOccurrences && data.extraOccurrences.length > 0) {
      // Check if any entry has an empty date
      const hasEmptyDate = data.extraOccurrences.some(
        (occ) => !occ?.date || occ.date.trim() === ""
      )
      if (hasEmptyDate) {
        // Don't add error here - let the individual date field validation handle it
        // This prevents the array-level validation from failing
      }
    }
  })
  .superRefine((data, ctx) => {
    // Validate occurrences conditionally based on event type
    // Performance types (ORGANIZER, PIECE) require occurrences
    // Auditions require occurrences (for audition date)
    // Creative opportunities don't use occurrences (only deadlineOccurrences)
    // Classes require occurrences
    
    // Check if deadlineOccurrences has data - indicates audition or creative opportunity
    const hasDeadlineOccurrences = !!(data.deadlineOccurrences && Array.isArray(data.deadlineOccurrences) && data.deadlineOccurrences.length > 0)
    
    // Only validate occurrences if we're certain it's required
    const isPerformance = data.type === "ORGANIZER" || data.type === "PIECE"
    const isClass = !!(data.classWorkshopType)
    
    // For auditions: must have deadlineOccurrences AND audition-specific fields (eligibility/instructions)
    // AND NOT have creative-specific fields (host/dates/requirements)
    const hasAuditionFields = !!(data.eligibility && data.instructions)
    const hasCreativeFields = !!(data.host && data.dates && data.requirements && data.link)
    
    const isAudition = hasDeadlineOccurrences && hasAuditionFields && !hasCreativeFields && !data.type
    
    // Creative opportunities have deadlineOccurrences AND creative-specific fields
    const isCreative = hasDeadlineOccurrences && hasCreativeFields && !data.type
    
    // Only validate occurrences for types that definitely need it
    // Skip validation for creative opportunities (they only use deadlineOccurrences)
    if ((isPerformance || isClass || isAudition) && !isCreative) {
      if (!data.occurrences || data.occurrences.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["occurrences"],
          message: "Add at least one date & time",
        })
      }
    }
    // For creative opportunities, occurrences is optional (they use deadlineOccurrences instead)
  })
  .passthrough()

export type EventFormData = z.infer<typeof eventFormSchema>

// Backwards-compat exports for existing imports
export const performanceSchema = eventFormSchema
export type PerformanceFormData = EventFormData

// Optional: export these if your UI blocks want them
export { occurrenceSchema, occurrencesSchema, extraDateSchema, extraTimeSchema }
