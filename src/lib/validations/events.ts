import { z } from "zod"

// Shared base across all forms
// Note: submitterName, submitterPronouns, contactEmail are retrieved from authenticated user session
const baseSchema = z.object({
  submitterName: z.string().optional(),
  submitterPronouns: z.string().optional(),
  contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  company: z.string().optional(),
  companyWebsite: z.string().url("Invalid URL").optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  placeId: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  socialHandles: z.string().min(1, "Social media handles are required"),
  notes: z.string().optional(),
  photoUrls: z
    .array(z.string().url("Invalid URL"))
    .min(1, "At least one photo URL is required")
    .max(5, "Maximum 5 photo URLs"),
  credits: z.string().min(1, "Image description / credit is required"),
})

/**
 * Canonical schedule shape:
 * occurrences = [{ date, times: [{ time }] }]
 *
 * You can reuse this across performance / classes later.
 */
const occurrenceTimeSchema = z.object({
  time: z.string().min(1, "Time is required"),
})

const occurrenceSchema = z.object({
  date: z.string().min(1, "Date is required"),
  times: z.array(occurrenceTimeSchema).min(1, "At least one time is required"),
})

const occurrencesSchema = z.array(occurrenceSchema).min(1, "Add at least one date & time")

/**
 * Backwards-compat helpers (your existing extras)
 * (Same shape as canonical; keep these exports to avoid breaking imports)
 */
const extraTimeSchema = occurrenceTimeSchema
const extraDateSchema = occurrenceSchema

/**
 * Performance-only fields
 * - Adds canonical: occurrences
 * - Keeps legacy: extraOccurrences
 * - Adds piece linking + schedule mode
 */
const performanceFields = z
  .object({
    title: z.string().optional(),

    // Legacy simple variant (keep optional; UI can stop using these)
    date: z.string().optional(),
    showTime: z.string().optional(),

    // Branching
    type: z.enum(["ORGANIZER", "PIECE"]).optional(),
    otherType: z.string().optional(),
    
    // Event type for organizer submissions
    event_type: z.enum(["SOLO", "SPLIT_BILL", "FESTIVAL"]).optional(),

    // Legacy festival / split-bill fields (keep for now)
    festival_name: z.string().optional(),
    festival_link: z.string().url("Invalid URL").optional(),
    split_bill_name: z.string().optional(),
    split_bill_link: z.string().url("Invalid URL").optional(),

    ticketPrice: z.string().optional(),
    ticketLink: z.string().url("Invalid URL").optional(),
    shortDescription: z.string().max(1000, "Description must be 1000 characters or less").optional(),
    agreeCompTickets: z.boolean().optional(),

    /**
     * NEW (recommended): canonical occurrences used by UI
     * Organizer: event schedule
     * Piece: used when pieceScheduleMode = CUSTOM
     */
    occurrences: occurrencesSchema.optional(),

    /**
     * LEGACY: keep accepting this (same shape) so existing UI doesn’t break
     * Prefer occurrences going forward.
     */
    extraOccurrences: z.array(extraDateSchema).min(1, "Add at least one date & time").optional(),

    /**
     * Organizer flow: optionally add a piece now
     */
    addPiece: z.boolean().optional(),

    /**
     * Piece flow: link to parent event
     * (These are optional in schema; you can require them per-step in UI)
     */
    parentEventMode: z.enum(["SELECT", "MANUAL"]).optional(), // default in UI
    parentEventId: z.string().optional(),

    // If MANUAL:
    parentEventName: z.string().optional(),
    parentEventWebsite: z.string().url("Invalid URL").optional(),
    parentEventTicketLink: z.string().url("Invalid URL").optional(),
    parentEventContactEmail: z.string().email("Invalid email address").optional(),

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
    listingFeeOption: z.enum(["PAY_FEE", "PROVIDE_TICKET", "EXPLAIN"]).optional(),
    listingFeeExplanation: z.string().optional(),
    complementaryTicketInfo: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Helper: normalize occurrences from either field
    const normalizedOccurrences =
      (data.occurrences && data.occurrences.length > 0
        ? data.occurrences
        : data.extraOccurrences && data.extraOccurrences.length > 0
          ? data.extraOccurrences
          : undefined)

    // If this is a performance submission, ensure schedule is present in the right way.
    // (You can loosen this if you truly want to allow drafts.)
    if (data.type === "ORGANIZER") {
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

      // Schedule requirement depends on schedule mode
      if (scheduleMode === "FROM_PARENT") {
        if (!data.selectedSlots || data.selectedSlots.length === 0) {
          ctx.addIssue({
            code: "custom",
            path: ["selectedSlots"],
            message: "Select at least one date/time from the event schedule",
          })
        }
      } else {
        if (!normalizedOccurrences?.length) {
          ctx.addIssue({
            code: "custom",
            path: ["occurrences"],
            message: "Add at least one date & time for your piece",
          })
        }
      }
    }
  })

// Audition-only
const auditionFields = z.object({
  auditionName: z.string().optional(),
  aboutProject: z.string().optional(),
  eligibility: z.string().optional(),
  compensation: z.string().optional(),
  auditionDate: z.string().optional(),
  auditionTime: z.string().optional(),
  auditionOccurrences: z.array(occurrenceSchema).min(1, "Add at least one audition date & time").optional(),
  deadlineOccurrences: z.array(occurrenceSchema).min(1, "Add at least one deadline date & time").optional(),
  auditionFee: z.enum(["FEE", "NO_FEE"]).optional(),
  auditionFeeAmount: z.string().optional(),
  auditionLink: z.string().url("Invalid URL").optional(),
  /**
   * Listing fee fields (only shown if auditionFee === "FEE")
   * Established artists: $50
   * Emerging artists: $35
   */
  auditionArtistType: z.enum(["ESTABLISHED", "EMERGING"]).optional(),
})

// Creative Opportunity-only
const creativeFields = z.object({
  opportunityName: z.string().optional(),
  briefDescription: z.string().max(2000).optional(),
  creativeEligibility: z.string().optional(),
  whatsOffered: z.string().optional(),
  stipendAmount: z.string().optional(),
  requirements: z.string().optional(),
  deadline: z.string().optional(),
  opportunityDeadlineOccurrences: z.array(occurrenceSchema).min(1, "Add at least one deadline date & time").optional(),
  opportunityFee: z.enum(["FEE", "NO_FEE"]).optional(),
  opportunityFeeAmount: z.string().optional(),
  applyLink: z.string().url("Invalid URL").optional(),
  /**
   * Listing fee fields (only shown if opportunityFee === "FEE")
   * Established artists: $50
   * Emerging artists: $35
   */
  opportunityArtistType: z.enum(["ESTABLISHED", "EMERGING"]).optional(),
})

// Class / Workshop-only
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
const classFields = z
  .object({
    /**
     * IMPORTANT: do NOT reuse `type` here (performance uses `type`).
     * This prevents schema merge collisions.
     */
    classWorkshopType: z.enum(["CLASS", "WORKSHOP"]).optional(),

    // Core fields for class/workshop listings
    classTitle: z.string().min(1, "Title is required").optional(),
    teachers: z.string().min(1, "Teacher(s) are required").optional(),
    shortDescription: z
      .string()
      .min(1, "Short description is required")
      .max(1000, "Short description must be 1000 characters or less")
      .optional(),
    styleCategory: z.string().optional(), // or z.enum([...]) if you want strict options
    venueName: z.string().min(1, "Venue name is required").optional(),

    /**
     * NEW: use canonical occurrences shape for schedule
     * (dates-only; no recurring logic needed)
     */
    classOccurrences: occurrencesSchema.optional(),

    /**
     * NEW: festival/workshop association flow (simple + user-friendly)
     * Yes/No -> if Yes: try to attach -> if not found: create placeholder
     */
    isPartOfFestivalOrWorkshop: z.enum(["YES", "NO"]).optional(),
    parentEventId: z.string().optional(),

    // Placeholder parent event (minimal)
    placeholderTitle: z.string().optional(),
    placeholderOrganizerName: z.string().optional(),
    placeholderContactEmail: z.string().email("Invalid email address").optional(),
    placeholderWebsiteOrSocial: z.string().optional(),
    placeholderStartDate: dateOnly.optional(),
    placeholderEndDate: dateOnly.optional(),

    // Workshop-only extras (optional)
    workshopDetails: z.string().optional(),
    classesOffered: z.string().optional(),

    /**
     * LEGACY (keep optional so old UI/data doesn't break)
     * You can remove these later once migrations are done.
     */
    festivalName: z.string().optional(),
    festivalLink: z.string().url("Invalid URL").optional(),
    className: z.string().optional(),
    classDates: z.string().optional(),
    classTimes: z.string().optional(),
    classExtraOccurrences: z
      .array(
        z.object({
          date: z.string().min(1, "Date is required"),
          time: z.string().min(1, "Time is required"),
        })
      )
      .optional(),
    classPrices: z.string().optional(),
    classLink: z.string().url("Invalid URL").optional(),
    classDescription: z.string().max(2000).optional(),
    classCreditInfo: z.string().optional(),
    classRecurrence: z.string().optional(),

    /**
     * Class/Workshop listing fee fields
     * Established artists: $50 fee (automatic)
     * Emerging artists: choose between $35 fee, provide guest spot, or explain
     * For CLASS type with multiple dates: additional fees may apply
     */
    classArtistType: z.enum(["ESTABLISHED", "EMERGING"]).optional(),
    classListingFeeOption: z.enum(["PAY_FEE", "PROVIDE_GUEST_SPOT", "EXPLAIN"]).optional(),
    classListingFeeExplanation: z.string().optional(),
    guestSpotInfo: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const isClassOrWorkshop =
      data.classWorkshopType === "CLASS" || data.classWorkshopType === "WORKSHOP"

    if (!isClassOrWorkshop) return

    // Required essentials (only when this is the active listing type)
    if (!data.classTitle) {
      ctx.addIssue({ code: "custom", path: ["classTitle"], message: "Title is required" })
    }
    if (!data.teachers) {
      ctx.addIssue({ code: "custom", path: ["teachers"], message: "Teacher(s) are required" })
    }
    if (!data.shortDescription) {
      ctx.addIssue({
        code: "custom",
        path: ["shortDescription"],
        message: "Short description is required",
      })
    }
    if (!data.venueName) {
      ctx.addIssue({ code: "custom", path: ["venueName"], message: "Venue name is required" })
    }

    // Schedule required
    if (!data.classOccurrences || data.classOccurrences.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["classOccurrences"],
        message: "Add at least one date & time",
      })
    }

    // Association logic (only for CLASS; workshops can stand alone)
    if (data.classWorkshopType === "CLASS") {
      const assoc = data.isPartOfFestivalOrWorkshop ?? "NO"
      if (assoc === "YES") {
        const hasParentId = !!data.parentEventId
        const creatingPlaceholder = !!data.placeholderTitle

        if (!hasParentId && !creatingPlaceholder) {
          ctx.addIssue({
            code: "custom",
            path: ["parentEventId"],
            message: "Select an existing festival/workshop or create a placeholder",
          })
        }

        if (!hasParentId && creatingPlaceholder) {
          if (!data.placeholderOrganizerName) {
            ctx.addIssue({
              code: "custom",
              path: ["placeholderOrganizerName"],
              message: "Organizer name is required",
            })
          }
          if (!data.placeholderContactEmail) {
            ctx.addIssue({
              code: "custom",
              path: ["placeholderContactEmail"],
              message: "Contact email is required",
            })
          }
          if (!data.placeholderStartDate) {
            ctx.addIssue({
              code: "custom",
              path: ["placeholderStartDate"],
              message: "Start date is required",
            })
          }
          if (!data.placeholderEndDate) {
            ctx.addIssue({
              code: "custom",
              path: ["placeholderEndDate"],
              message: "End date is required",
            })
          }
        }
      }
    }
  })


// Funding-only
const fundingFields = z.object({
  fundingLink: z.string().url("Invalid URL").optional(),
  fundingTitle: z.string().optional(),
  fundingSummary: z.string().optional(),
})

export const eventFormSchema = baseSchema
  .merge(performanceFields)
  .merge(auditionFields)
  .merge(creativeFields)
  .merge(classFields)
  .merge(fundingFields)
  .passthrough()

export type EventFormData = z.infer<typeof eventFormSchema>

// Backwards-compat exports for existing imports
export const performanceSchema = eventFormSchema
export type PerformanceFormData = EventFormData

// Optional: export these if your UI blocks want them
export { occurrenceSchema, occurrencesSchema, extraDateSchema, extraTimeSchema }
