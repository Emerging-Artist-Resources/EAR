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
        message: "Location is required",
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
    // Skip validation for PIECE type - it has its own validation logic that checks extraOccurrences/selectedSlots
    const isPiece = data.type === "PIECE"
    if ((isPerformance || isClass || isAudition) && !isCreative && !isPiece) {
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
  .superRefine((data, ctx) => {
    // Validate listing fee for ORGANIZER performance submissions
    const isOrganizer = data.type === "ORGANIZER"
    if (isOrganizer) {
      if (!data.artistType) {
        ctx.addIssue({
          code: "custom",
          path: ["artistType"],
          message: "Artist type is required",
        })
      }
      if (!data.listingFeeOption) {
        ctx.addIssue({
          code: "custom",
          path: ["listingFeeOption"],
          message: "Listing fee option is required",
        })
      }
      // If listing fee option is EXPLAIN, require explanation
      if (data.listingFeeOption === "EXPLAIN" && (!data.listingFeeExplanation || data.listingFeeExplanation.trim() === "")) {
        ctx.addIssue({
          code: "custom",
          path: ["listingFeeExplanation"],
          message: "Please explain your alternative arrangement",
        })
      }
      // If listing fee option is PROVIDE, require complementary ticket info
      if (data.listingFeeOption === "PROVIDE" && (!data.complementaryTicketInfo || data.complementaryTicketInfo.trim() === "")) {
        ctx.addIssue({
          code: "custom",
          path: ["complementaryTicketInfo"],
          message: "Please provide complementary ticket information",
        })
      }
    }
    
    // Validate URL format for link field when it's required
    if (isOrganizer && data.link && data.link.trim() !== "") {
      try {
        new URL(data.link)
      } catch {
        ctx.addIssue({
          code: "custom",
          path: ["link"],
          message: "Ticket link must be a valid URL",
        })
      }
    }
  })
  .passthrough()

export type EventFormData = z.infer<typeof eventFormSchema>

// Constants
export const EVENT_STEPS = {
  TYPE_SELECTION: 1,
  FORM_FIELDS: 2,
  REVIEW_SUBMIT: 3,
} as const

export const DEFAULT_EVENT_ERROR_MESSAGE = "Please complete all required fields"

// Step-specific schemas for step 2 validation
// These schemas pick relevant fields and preserve type-specific validation logic
// Using .passthrough() to allow extra fields from the full form data

// Performance step 2 schema
export const performanceStep2Schema = baseSchema
  .merge(performanceFields)
  .pick({
    title: true,
    description: true,
    organizer: true,
    link: true,
    price: true,
    occurrences: true,
    extraOccurrences: true,
    type: true,
    pieceScheduleMode: true,
    selectedSlots: true,
    parentEventId: true,
    parentEventName: true,
    address: true,
    venueName: true,
    placeId: true,
    lat: true,
    lng: true,
    locationInstructions: true,
  })
  .passthrough()
  .superRefine((data, ctx) => {
    // First, require type to be selected
    if (!data.type) {
      ctx.addIssue({
        code: "custom",
        path: ["type"],
        message: "Performance type is required",
      })
      return // Don't continue validation if type is missing
    }
    
    // Preserve performance-specific validation logic
    if (data.type === "ORGANIZER") {
      if (!data.title || data.title.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["title"],
          message: "Title is required",
        })
      }
      if (!data.description || data.description.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["description"],
          message: "Description is required",
        })
      }
      if (!data.organizer || data.organizer.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["organizer"],
          message: "Organizer is required",
        })
      }
      if (!data.link || data.link.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["link"],
          message: "Ticket link is required",
        })
      } else {
        // Validate URL format
        try {
          new URL(data.link)
        } catch {
          ctx.addIssue({
            code: "custom",
            path: ["link"],
            message: "Ticket link must be a valid URL",
          })
        }
      }
      if (!data.price || data.price.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["price"],
          message: "Price is required",
        })
      }
      const hasValidOccurrences = Array.isArray(data.occurrences) &&
        data.occurrences.length > 0 &&
        data.occurrences.some(
          (d) =>
            d?.date && d.date.trim() !== "" &&
            Array.isArray(d?.times) &&
            d.times.length > 0 &&
            d.times.some((t) => t?.time && t.time.trim() !== "")
        )
      if (!hasValidOccurrences) {
        ctx.addIssue({
          code: "custom",
          path: ["occurrences"],
          message: "Add at least one date & time",
        })
      } else if (Array.isArray(data.occurrences)) {
        // Validate that each occurrence has location data
        const occurrencesWithMissingLocation = data.occurrences
          .map((occ, index) => ({ occ, index }))
          .filter(({ occ }) => {
            // Check if this occurrence has valid date/time
            const hasValidDateTime = occ?.date && occ.date.trim() !== "" &&
              Array.isArray(occ?.times) &&
              occ.times.length > 0 &&
              occ.times.some((t) => t?.time && t.time.trim() !== "")
            
            if (!hasValidDateTime) return false
            
            // Check if location is provided (at least one of: address, venueName, or placeId)
            const hasLocation = (occ?.address && occ.address.trim() !== "") ||
              (occ?.venueName && occ.venueName.trim() !== "") ||
              (occ?.placeId && occ.placeId.trim() !== "")
            
            return !hasLocation
          })
        
        if (occurrencesWithMissingLocation.length > 0) {
          // Report error on first occurrence missing location
          const firstMissing = occurrencesWithMissingLocation[0]
          ctx.addIssue({
            code: "custom",
            path: ["occurrences", firstMissing.index, "address"],
            message: "Location is required for each date & time",
          })
        }
      }
    }
    if (data.type === "PIECE") {
      // Validation order matches form field order for PIECE
      // 1. Parent event selection (Find Your Event section)
      const parentMode = data.parentEventMode ?? "SELECT"
      if (parentMode === "SELECT") {
        if (!data.parentEventId) {
          ctx.addIssue({
            code: "custom",
            path: ["parentEventId"],
            message: "Select an event/festival",
          })
        }
      } else {
        // MANUAL mode - require parent event name
        if (!data.parentEventName || data.parentEventName.trim() === "") {
          ctx.addIssue({
            code: "custom",
            path: ["parentEventName"],
            message: "Event/festival name is required",
          })
        }
      }
      
      // 2. Piece schedule (Piece Details section - PieceOccurrencesPicker)
      const scheduleMode = data.pieceScheduleMode ?? "FROM_PARENT"
      const hasCustomOccurrences = Array.isArray(data.extraOccurrences) &&
        data.extraOccurrences.length > 0 &&
        data.extraOccurrences.some(
          (d) =>
            d?.date && d.date.trim() !== "" &&
            Array.isArray(d?.times) &&
            d.times.length > 0 &&
            d.times.some((t) => t?.time && t.time.trim() !== "")
        )
      const hasSelectedSlots = Array.isArray(data.selectedSlots) && data.selectedSlots.length > 0
      if (!hasSelectedSlots && !hasCustomOccurrences) {
        if (scheduleMode === "FROM_PARENT") {
          ctx.addIssue({
            code: "custom",
            path: ["selectedSlots"],
            message: "Select at least one date/time from the event schedule, or add custom dates/times",
          })
        } else {
          ctx.addIssue({
            code: "custom",
            path: ["extraOccurrences"],
            message: "Add at least one date & time for your piece",
          })
        }
      }
    }
  })

// Audition step 2 schema
export const auditionStep2Schema = baseSchema
  .merge(auditionFields)
  .pick({
    title: true,
    description: true,
    eligibility: true,
    compensation: true,
    instructions: true,
    occurrences: true,
    deadlineOccurrences: true,
    fee: true,
    feeAmount: true,
    artistType: true,
    address: true,
    venueName: true,
    placeId: true,
    lat: true,
    lng: true,
    locationInstructions: true,
  })
  .passthrough()
  .superRefine((data, ctx) => {
    // Preserve audition-specific validation logic
    // Validation order matches form field order exactly
    // Audition Details section
    if (!data.title || data.title.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["title"],
        message: "Title is required",
      })
    }
    if (!data.description || data.description.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["description"],
        message: "Description is required",
      })
    }
    if (!data.eligibility || data.eligibility.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["eligibility"],
        message: "Eligibility is required",
      })
    }
    if (!data.compensation || data.compensation.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["compensation"],
        message: "Compensation is required",
      })
    }
    if (!data.instructions || data.instructions.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["instructions"],
        message: "Instructions is required",
      })
    }
    if (!data.fee) {
      ctx.addIssue({
        code: "custom",
        path: ["fee"],
        message: "Fee selection is required",
      })
    }
    // Conditional validation for fee (matches form order - feeAmount shown after fee)
    if (data.fee === "FEE") {
      if (!data.feeAmount || data.feeAmount.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["feeAmount"],
          message: "Fee amount is required when there is a fee",
        })
      }
    }
    // Key Dates section
    if (!data.occurrences || data.occurrences.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["occurrences"],
        message: "Add at least one date & time",
      })
    }
    if (!data.deadlineOccurrences || data.deadlineOccurrences.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["deadlineOccurrences"],
        message: "Deadline date or deadline time is required",
      })
    }
    // Location section
    if (!data.address || data.address.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["address"],
        message: "Location is required",
      })
    }
  })

// Creative step 2 schema
export const creativeStep2Schema = baseSchema
  .merge(creativeFields)
  .pick({
    title: true,
    host: true,
    dates: true,
    description: true,
    compensation: true,
    requirements: true,
    link: true,
    deadlineOccurrences: true,
    fee: true,
    feeAmount: true,
    address: true,
    venueName: true,
    placeId: true,
    lat: true,
    lng: true,
    locationInstructions: true,
  })
  .passthrough()
  .superRefine((data, ctx) => {
    // Preserve creative-specific validation logic
    // Validation order matches form field order
    if (!data.title || data.title.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["title"],
        message: "Title is required",
      })
    }
    if (!data.host || data.host.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["host"],
        message: "Host is required",
      })
    }
    if (!data.dates || data.dates.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["dates"],
        message: "Opportunity dates are required",
      })
    }
    if (!data.description || data.description.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["description"],
        message: "Description is required",
      })
    }
    if (!data.compensation || data.compensation.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["compensation"],
        message: "Compensation is required",
      })
    }
    if (!data.requirements || data.requirements.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["requirements"],
        message: "Requirements is required",
      })
    }
    if (!data.link || data.link.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["link"],
        message: "Link is required",
      })
    }
    if (!data.deadlineOccurrences || data.deadlineOccurrences.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["deadlineOccurrences"],
        message: "Deadline date or deadline time is required",
      })
    }
    if (!data.fee) {
      ctx.addIssue({
        code: "custom",
        path: ["fee"],
        message: "Fee selection is required",
      })
    }
    // Conditional validation for fee (matches form order - feeAmount shown after fee)
    if (data.fee === "FEE") {
      if (!data.feeAmount || data.feeAmount.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["feeAmount"],
          message: "Fee amount is required when there is a fee",
        })
      }
    }
    if (!data.address || data.address.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["address"],
        message: "Location is required",
      })
    }
  })

// Class step 2 schema
export const classStep2Schema = baseSchema
  .merge(classFields)
  .pick({
    title: true,
    description: true,
    organizer: true,
    price: true,
    link: true,
    teachers: true,
    occurrences: true,
    classWorkshopType: true,
    address: true,
    venueName: true,
    placeId: true,
    lat: true,
    lng: true,
    locationInstructions: true,
  })
  .passthrough()
  .superRefine((data, ctx) => {
    // Preserve class-specific validation logic
    // Validation order matches form field order
    // First, require type to be selected
    if (!data.classWorkshopType || (data.classWorkshopType !== "CLASS" && data.classWorkshopType !== "WORKSHOP")) {
      ctx.addIssue({
        code: "custom",
        path: ["classWorkshopType"],
        message: "Submission type is required",
      })
      return // Don't continue validation if type is missing
    }

    const isClassOrWorkshop =
      data.classWorkshopType === "CLASS" || data.classWorkshopType === "WORKSHOP"
    if (!isClassOrWorkshop) return

    const normalizedOccurrences = data.occurrences && data.occurrences.length > 0
      ? data.occurrences
      : undefined

    if (!data.title || data.title.trim() === "") {
      ctx.addIssue({ code: "custom", path: ["title"], message: "Title is required" })
    }
    if (!data.organizer || data.organizer.trim() === "") {
      ctx.addIssue({ code: "custom", path: ["organizer"], message: "Organizer is required" })
    }
    if (data.classWorkshopType === "CLASS") {
      if (!data.price || data.price.trim() === "") {
        ctx.addIssue({ code: "custom", path: ["price"], message: "Price is required" })
      }
      if (!data.link || data.link.trim() === "") {
        ctx.addIssue({ code: "custom", path: ["link"], message: "Link is required" })
      }
    }
    if (!data.description || data.description.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["description"],
        message: "Description is required",
      })
    }
    // Teachers field is not shown in the form, so it should not be required
    // If teachers field is added to the form in the future, add validation here conditionally
    
    // Validate occurrences: must have at least one occurrence with valid date/time
    if (!normalizedOccurrences || normalizedOccurrences.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["occurrences"],
        message: "Add at least one date & time",
      })
    } else {
      // Check if there are any occurrences with valid date/time
      const validOccurrences = normalizedOccurrences.filter((occ) => {
        return occ?.date && occ.date.trim() !== "" &&
          Array.isArray(occ?.times) &&
          occ.times.length > 0 &&
          occ.times.some((t) => t?.time && t.time.trim() !== "")
      })
      
      if (validOccurrences.length === 0) {
        // No valid occurrences found
        ctx.addIssue({
          code: "custom",
          path: ["occurrences"],
          message: "Add at least one date & time",
        })
      } else {
        // Validate that each occurrence with valid date/time has location data
        const occurrencesWithMissingLocation = normalizedOccurrences
          .map((occ, index) => ({ occ, index }))
          .filter(({ occ }) => {
            // Check if this occurrence has valid date/time
            const hasValidDateTime = occ?.date && occ.date.trim() !== "" &&
              Array.isArray(occ?.times) &&
              occ.times.length > 0 &&
              occ.times.some((t) => t?.time && t.time.trim() !== "")
            
            if (!hasValidDateTime) return false
            
            // Check if location is provided (at least one of: address, venueName, or placeId)
            const hasLocation = (occ?.address && occ.address.trim() !== "") ||
              (occ?.venueName && occ.venueName.trim() !== "") ||
              (occ?.placeId && occ.placeId.trim() !== "")
            
            return !hasLocation
          })
        
        if (occurrencesWithMissingLocation.length > 0) {
          // Report error on first occurrence missing location
          const firstMissing = occurrencesWithMissingLocation[0]
          ctx.addIssue({
            code: "custom",
            path: ["occurrences", firstMissing.index, "address"],
            message: "Location is required for each date & time",
          })
        }
      }
    }
  })

// Funding step 2 schema (minimal - only fundingLink)
export const fundingStep2Schema = z.object({
  fundingLink: z.string().min(1, "Funding link is required"),
}).passthrough()

// Backwards-compat exports for existing imports
export const performanceSchema = eventFormSchema
export type PerformanceFormData = EventFormData

// Optional: export these if your UI blocks want them
export { occurrenceSchema, occurrencesSchema, extraDateSchema, extraTimeSchema }
