import { z } from "zod"
import { occurrenceSchema, extraDateSchema } from "./base"
import { ORGANIZER_OCCURRENCE_USER_MESSAGES } from "./occurrence-row"

/**
 * Performance-only fields
 * - Adds canonical: occurrences
 * - Keeps legacy: extraOccurrences
 * - Adds piece linking + schedule mode
 */
export const performanceFields = z
  .object({
    title: z.string().optional(),
    description: z.string().max(2000, "Description must be 2000 characters or less").optional(),
    organizer: z.string().optional(),
    website: z.string().url("Invalid URL").optional().or(z.literal("")),
    link: z.string().url("Invalid URL").optional().or(z.literal("")),
    price: z.string().optional(),
    participants: z.string().optional(),

    // Legacy simple variant (keep optional; UI can stop using these)
    date: z.string().optional(),
    showTime: z.string().optional(),

    // Branching
    type: z.enum(["ORGANIZER", "PIECE"]).optional(),
    otherType: z.string().optional(),
    
    // Event type for organizer submissions
    eventType: z.enum(["SOLO", "SPLIT_BILL", "FESTIVAL"]).optional(),

    // Legacy festival / split-bill fields (keep for now)
    festival_name: z.string().optional(),
    festival_link: z.string().url("Invalid URL").optional(),
    split_bill_name: z.string().optional(),
    split_bill_link: z.string().url("Invalid URL").optional(),

    agreeCompTickets: z.boolean().optional(),
    eventDatesConfirmed: z.boolean().optional(),

    /**
     * NEW (recommended): canonical occurrences used by UI
     * Organizer: event schedule
     * Piece: used when pieceScheduleMode = CUSTOM
     * Note: Using z.array() without .min() to allow empty arrays.
     * Validation requiring at least one occurrence is done conditionally in superRefine based on event type.
     */
    occurrences: z.array(occurrenceSchema).optional(),

    /**
     * LEGACY: keep accepting this (same shape) so existing UI doesn't break
     * Prefer occurrences going forward.
     * Note: Validation is conditional in superRefine - only for PERFORMANCE type
     * Using a lenient schema that allows empty dates to prevent validation errors
     * for non-performance types (auditions, creative, classes)
     */
    extraOccurrences: z.array(
      extraDateSchema.extend({
        date: z.string().optional(),
        times: z.array(z.object({ time: z.string().optional() })).optional(),
      })
    ).optional(),

    /**
     * Organizer flow: optionally add a piece now
     */
    addPiece: z.preprocess(
      (val) => {
        if (val === "true" || val === true) return true
        if (val === "false" || val === false) return false
        return val
      },
      z.boolean().optional()
    ),

    /**
     * Piece flow: link to parent event
     * (These are optional in schema; you can require them per-step in UI)
     */
    parentEventMode: z.enum(["SELECT", "MANUAL"]).optional(), // default in UI
    parentEventId: z.string().optional(),

    // If MANUAL:
    parentEventName: z.string().optional(),
    parentEventWebsite: z.string().url("Invalid URL").optional().or(z.literal("")),
    parentEventTicketLink: z.string().url("Invalid URL").optional(),
    parentEventContactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),

    /**
     * Piece schedule mode:
     * FROM_PARENT: user selects one or more slots from parent schedule
     * CUSTOM: user enters occurrences for their piece (use occurrences/extraOccurrences)
     */
    pieceScheduleMode: z.enum(["FROM_PARENT", "CUSTOM"]).optional(),
    selectedSlots: z.array(z.string()).optional(), // keys like "YYYY-MM-DD|HH:mm" for now

    /**
     * Platform listing fee fields (ORGANIZER)
     * Established: fee path via PAY_FEE / automatic display.
     * Emerging: waived; server forces these to null for EMERGING.
     */
    artistType: z.enum(["ESTABLISHED", "EMERGING"]).optional(),
    listingFeeOption: z.enum(["PAY_FEE", "PROVIDE", "EXPLAIN"]).optional(),
    listingFeeExplanation: z.string().optional(),
    complementaryTicketInfo: z.string().optional(),

    /**
     * Piece detail fields (for PIECE type)
     * These fields are used when submitting a piece within a larger event
     */
    piece_company: z.string().optional(),
    piece_companyWebsite: z.string().url("Invalid URL").optional().or(z.literal("")),
    piece_title: z.string().optional(),
    piece_choreographer: z.string().optional(),
    piece_description: z.string().optional(),
    piece_credits: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Require type field for performance submissions
    // This catches cases where user hasn't selected ORGANIZER or PIECE
    if (!data.type || (data.type !== "ORGANIZER" && data.type !== "PIECE")) {
      ctx.addIssue({
        code: "custom",
        path: ["type"],
        message: "Please select what you are submitting",
      })
      return // Don't continue with other validations if type is missing
    }

    // Helper: normalize occurrences from either field
    // Check if occurrences has valid data (date and time)
    const hasValidOccurrences = Array.isArray(data.occurrences) &&
      data.occurrences.length > 0 &&
      data.occurrences.some(
        (d) =>
          d?.date && d.date.trim() !== "" &&
          Array.isArray(d?.times) &&
          d.times.length > 0 &&
          d.times.some((t) => t?.time && t.time.trim() !== "")
      )
    
    // Check if extraOccurrences has valid data
    const hasValidExtraOccurrences = Array.isArray(data.extraOccurrences) &&
      data.extraOccurrences.length > 0 &&
      data.extraOccurrences.some(
        (d) =>
          d?.date && d.date.trim() !== "" &&
          Array.isArray(d?.times) &&
          d.times.length > 0 &&
          d.times.some((t) => t?.time && t.time.trim() !== "")
      )
    
    const normalizedOccurrences =
      (hasValidOccurrences
        ? data.occurrences
        : hasValidExtraOccurrences
          ? data.extraOccurrences
          : undefined)

    // If this is a performance submission, ensure schedule is present in the right way.
    // (You can loosen this if you truly want to allow drafts.)
    if (data.type === "ORGANIZER") {
      // Event type is required for organizer submissions
      if (!data.eventType) {
        ctx.addIssue({
          code: "custom",
          path: ["eventType"],
          message: "Event type is required",
        })
      }
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
      }
      if (!data.price || data.price.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["price"],
          message: "Price is required",
        })
      }
      if (!normalizedOccurrences?.length) {
        ctx.addIssue({
          code: "custom",
          path: ["occurrences"],
          message: ORGANIZER_OCCURRENCE_USER_MESSAGES.needSchedule,
        })
      }
    }

    if (data.type === "PIECE") {
      const parentMode = data.parentEventMode ?? "SELECT"
      const scheduleMode = data.pieceScheduleMode ?? "FROM_PARENT"

      // 1. Parent event requirement depends on mode
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

      // 2. Piece schedule validation
      // Check if user has custom occurrences (they can add custom dates even when selecting from parent)
      const hasCustomOccurrences = Array.isArray(data.extraOccurrences) &&
        data.extraOccurrences.length > 0 &&
        data.extraOccurrences.some(
          (d) =>
            d?.date && d.date.trim() !== "" &&
            Array.isArray(d?.times) &&
            d.times.length > 0 &&
            d.times.some((t) => t?.time && t.time.trim() !== "")
        )
      
      // Check if selectedSlots has data
      const hasSelectedSlots = Array.isArray(data.selectedSlots) && data.selectedSlots.length > 0
      
      // Determine what schedule options are available based on parentEventMode and parentEventId
      // selectedSlots can only be used if parentEventMode is SELECT AND parentEventId exists
      const canUseSelectedSlots = parentMode === "SELECT" && !!data.parentEventId
      
      // Require at least one schedule option
      if (!hasSelectedSlots && !hasCustomOccurrences) {
        if (canUseSelectedSlots && scheduleMode === "FROM_PARENT") {
          // Can select from parent, suggest that
          ctx.addIssue({
            code: "custom",
            path: ["selectedSlots"],
            message: "Select at least one date/time from the event schedule, or add custom dates/times",
          })
        } else {
          // Must use custom occurrences (MANUAL mode, CUSTOM schedule mode, or no parentEventId)
          ctx.addIssue({
            code: "custom",
            path: ["extraOccurrences"],
            message: "Add at least one date & time for your piece",
          })
        }
      }
      
      // Additional validation: if MANUAL mode, ensure custom occurrences are provided
      // (selectedSlots can't be used without a parentEventId)
      if (parentMode === "MANUAL" && !hasCustomOccurrences) {
        ctx.addIssue({
          code: "custom",
          path: ["extraOccurrences"],
          message: "Add at least one date & time for your piece (manual entry mode requires custom dates)",
        })
      }
      
      // Additional validation: if SELECT mode but no parentEventId, can't use selectedSlots
      if (parentMode === "SELECT" && !data.parentEventId && scheduleMode === "FROM_PARENT" && !hasCustomOccurrences) {
        ctx.addIssue({
          code: "custom",
          path: ["parentEventId"],
          message: "Select an event/festival to choose dates from its schedule, or add custom dates/times",
        })
      }

      // 2b. Validate location for custom occurrences (required for MANUAL mode, optional but validated for SELECT mode)
      // When using custom occurrences, location must be provided (can't inherit from parent)
      if (hasCustomOccurrences && Array.isArray(data.extraOccurrences)) {
        const occurrencesWithMissingLocation = data.extraOccurrences
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
          // Report error for each occurrence missing location
          occurrencesWithMissingLocation.forEach(({ index }) => {
            ctx.addIssue({
              code: "custom",
              path: ["extraOccurrences", index, "address"],
              message: "Location is required for each date & time",
            })
          })
        }
      }

      // 3. Piece detail fields (Piece Details section)
      if (!data.piece_company || data.piece_company.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["piece_company"],
          message: "Company / Artist Name is required",
        })
      }
      if (!data.piece_title || data.piece_title.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["piece_title"],
          message: "Piece Title is required",
        })
      }
      if (!data.piece_description || data.piece_description.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["piece_description"],
          message: "Piece Description is required",
        })
      }
      if (!data.piece_credits || data.piece_credits.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["piece_credits"],
          message: "Credits / Performers is required",
        })
      }
    }
  })
