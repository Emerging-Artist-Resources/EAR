import { z } from "zod"
import { occurrenceSchema, extraDateSchema } from "./base"

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
     * Listing fee fields
     * Established artists: $50 fee (automatic)
     * Emerging artists: choose between $35 fee, provide ticket, or explain
     */
    artistType: z.enum(["ESTABLISHED", "EMERGING"]).optional(),
    listingFeeOption: z.enum(["PAY_FEE", "PROVIDE", "EXPLAIN"]).optional(),
    listingFeeExplanation: z.string().optional(),
    complementaryTicketInfo: z.string().optional(),
  })
  .superRefine((data, ctx) => {
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
          message: "Add at least one date & time",
        })
      }
    }

    if (data.type === "PIECE") {
      const parentMode = data.parentEventMode ?? "SELECT"
      const scheduleMode = data.pieceScheduleMode ?? "FROM_PARENT"

      // Parent event requirement depends on mode
      if (parentMode === "SELECT") {
        if (!data.parentEventId) {
          ctx.addIssue({
            code: "custom",
            path: ["parentEventId"],
            message: "Select an event/festival",
          })
        }
      } else {
        if (!data.parentEventName) {
          ctx.addIssue({
            code: "custom",
            path: ["parentEventName"],
            message: "Event/festival name is required",
          })
        }
      }

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
      
      // Users can now have both selectedSlots AND extraOccurrences simultaneously
      // Require at least one of them
      if (!hasSelectedSlots && !hasCustomOccurrences) {
        // If in FROM_PARENT mode and parent occurrences are available, suggest selecting from parent
        if (scheduleMode === "FROM_PARENT") {
          ctx.addIssue({
            code: "custom",
            path: ["selectedSlots"],
            message: "Select at least one date/time from the event schedule, or add custom dates/times",
          })
        } else {
          // CUSTOM mode - require custom occurrences
          ctx.addIssue({
            code: "custom",
            path: ["extraOccurrences"],
            message: "Add at least one date & time for your piece",
          })
        }
      }
    }
  })
