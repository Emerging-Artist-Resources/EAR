import { z } from "zod"

// Shared base across all forms
// Note: User info (name, pronouns, email) is retrieved from authenticated user profile, not form data
const baseSchema = z.object({
  company: z.string().optional(),
  companyWebsite: z.string().url("Invalid URL").optional().or(z.literal("")),
  address: z.string().optional(),
  placeId: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  venueName: z.string().optional(),
  locationInstructions: z.string().optional(),
  socialHandles: z.string().optional(),
  notes: z.string().optional(),
  promoImagePaths: z.array(z.string()).max(5).optional(),
  credits: z.string().optional(),
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
    description: z.string().max(2000, "Description must be 2000 characters or less").optional(),
    organizer: z.string().optional(),
    website: z.string().url("Invalid URL").optional().or(z.literal("")),
    link: z.string().optional(),
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
     */
    occurrences: occurrencesSchema.optional(),

    /**
     * LEGACY: keep accepting this (same shape) so existing UI doesn't break
     * Prefer occurrences going forward.
     * Note: Validation is conditional in superRefine - only for PERFORMANCE type
     */
    extraOccurrences: z.array(extraDateSchema).optional(),

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
    listingFeeOption: z.enum(["PAY_FEE", "PROVIDE", "EXPLAIN"]).optional(),
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
const auditionFields = z
  .object({
    title: z.string().optional(),
    description: z.string().max(2000, "Description must be 2000 characters or less").optional(),
    eligibility: z.string().optional(),
    compensation: z.string().optional(),
    instructions: z.string().optional(),
    occurrences: z.array(occurrenceSchema).optional(),
    deadlineOccurrences: z.array(occurrenceSchema).optional(),
    fee: z.enum(["FEE", "NO_FEE"]).optional(),
    feeAmount: z.string().optional(),
    preAuditionClasses: z.string().optional(),
    /**
     * Listing fee fields (only shown if fee === "FEE")
     * Established artists: $50
     * Emerging artists: $35
     */
    artistType: z.enum(["ESTABLISHED", "EMERGING"]).optional(),
  })
  .superRefine((data, ctx) => {
    // Required fields
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
        message: "Instructions are required",
      })
    }
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
        message: "Add at least one deadline date & time",
      })
    }
    if (!data.fee) {
      ctx.addIssue({
        code: "custom",
        path: ["fee"],
        message: "Fee selection is required",
      })
    }

    // Conditional validation for fee
    if (data.fee === "FEE") {
      if (!data.feeAmount || data.feeAmount.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["feeAmount"],
          message: "Fee amount is required when there is a fee",
        })
      }
      if (!data.artistType) {
        ctx.addIssue({
          code: "custom",
          path: ["artistType"],
          message: "Artist type is required when there is a fee",
        })
      }
    }
  })

// Creative Opportunity-only
const creativeFields = z
  .object({
    title: z.string().optional(),
    description: z.string().max(2000, "Description must be 2000 characters or less").optional(),
    host: z.string().optional(),
    dates: z.string().optional(),
    compensation: z.string().optional(),
    requirements: z.string().optional(),
    link: z.string().optional(),
    deadlineOccurrences: z.array(occurrenceSchema).optional(),
    fee: z.enum(["FEE", "NO_FEE"]).optional(),
    feeAmount: z.string().optional(),
    /**
     * Listing fee fields (only shown if fee === "FEE")
     * Established artists: $50
     * Emerging artists: $35
     */
    artistType: z.enum(["ESTABLISHED", "EMERGING"]).optional(),
  })
  .superRefine((data, ctx) => {
    // Required fields
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
        message: "Requirements are required",
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
        message: "Add at least one deadline date & time",
      })
    }
    if (!data.fee) {
      ctx.addIssue({
        code: "custom",
        path: ["fee"],
        message: "Fee selection is required",
      })
    }

    // Conditional validation for fee
    if (data.fee === "FEE") {
      if (!data.feeAmount || data.feeAmount.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["feeAmount"],
          message: "Fee amount is required when there is a fee",
        })
      }
      if (!data.artistType) {
        ctx.addIssue({
          code: "custom",
          path: ["artistType"],
          message: "Artist type is required when there is a fee",
        })
      }
    }
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

    // Core fields for class/workshop listings (shared field names)
    title: z.string().optional(),
    description: z.string().max(2000, "Description must be 2000 characters or less").optional(),
    organizer: z.string().optional(),
    price: z.string().optional(),
    link: z.string().optional(),
    teachers: z.string().optional(),
    styleCategory: z.string().optional(), // or z.enum([...]) if you want strict options
    venueName: z.string().optional(),

    /**
     * NEW: use canonical occurrences shape for schedule
     * (dates-only; no recurring logic needed)
     */
    occurrences: occurrencesSchema.optional(),
    classOccurrences: occurrencesSchema.optional(), // Legacy support

    /**
     * NEW: festival/workshop association flow (simple + user-friendly)
     * Yes/No -> if Yes: try to attach -> if not found: create placeholder
     */
    isPartOfFestivalOrWorkshop: z.enum(["YES", "NO"]).optional(),
    parentEventId: z.string().optional(),
    selectedParentDates: z.array(z.string()).optional(),

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
    dropInClasses: z.string().optional(),

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
    classPrice: z.string().optional(),
    classLink: z.string().url("Invalid URL").optional(),
    classDescription: z.string().max(2000).optional(),
    classCreditInfo: z.string().optional(),
    classRecurrence: z.string().optional(),
    classTitle: z.string().optional(), // Legacy
    shortDescription: z.string().optional(), // Legacy

    /**
     * Class/Workshop listing fee fields (shared field names)
     * Established artists: $50 fee (automatic)
     * Emerging artists: choose between $35 fee, provide guest spot, or explain
     * For CLASS type with multiple dates: additional fees may apply
     */
    artistType: z.enum(["ESTABLISHED", "EMERGING"]).optional(),
    listingFeeOption: z.enum(["PAY_FEE", "PROVIDE", "EXPLAIN"]).optional(),
    listingFeeExplanation: z.string().optional(),
    guestSpotInfo: z.string().optional(),
    classArtistType: z.enum(["ESTABLISHED", "EMERGING"]).optional(), // Legacy
    classListingFeeOption: z.enum(["PAY_FEE", "PROVIDE", "EXPLAIN"]).optional(), // Legacy
    classListingFeeExplanation: z.string().optional(), // Legacy
  })
  .superRefine((data, ctx) => {
    const isClassOrWorkshop =
      data.classWorkshopType === "CLASS" || data.classWorkshopType === "WORKSHOP"

    if (!isClassOrWorkshop) return

    // Helper: normalize occurrences from either field
    const normalizedOccurrences =
      (data.occurrences && data.occurrences.length > 0
        ? data.occurrences
        : data.classOccurrences && data.classOccurrences.length > 0
          ? data.classOccurrences
          : undefined)

    // Required essentials (only when this is the active listing type)
    if (!data.title || data.title.trim() === "") {
      ctx.addIssue({ code: "custom", path: ["title"], message: "Title is required" })
    }
    if (!data.organizer || data.organizer.trim() === "") {
      ctx.addIssue({ code: "custom", path: ["organizer"], message: "Organizer is required" })
    }
    if (!data.teachers || data.teachers.trim() === "") {
      ctx.addIssue({ code: "custom", path: ["teachers"], message: "Teacher(s) are required" })
    }
    if (!data.description || data.description.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["description"],
        message: "Description is required",
      })
    }
    if (data.classWorkshopType === "CLASS") {
      if (!data.price || data.price.trim() === "") {
        ctx.addIssue({ code: "custom", path: ["price"], message: "Price is required" })
      }
      if (!data.link || data.link.trim() === "") {
        ctx.addIssue({ code: "custom", path: ["link"], message: "Link is required" })
      }
    }
    if (!normalizedOccurrences || normalizedOccurrences.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["occurrences"],
        message: "Add at least one date & time",
      })
    }
    if (!data.venueName || data.venueName.trim() === "") {
      ctx.addIssue({ code: "custom", path: ["venueName"], message: "Venue name is required" })
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
  .superRefine((data, ctx) => {
    // Address is required for all event types
    if (!data.address || data.address.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["address"],
        message: "Address is required",
      })
    }
    
    // Only validate extraOccurrences for PERFORMANCE type (legacy field)
    // For other types, this field should be ignored
    if (data.type && data.type !== "ORGANIZER" && data.type !== "PIECE") {
      // For non-performance types, don't validate extraOccurrences
      // This prevents validation errors for auditions, classes, etc.
      return
    }
    
    // For performance types, validate extraOccurrences only if it has items
    if (data.type === "ORGANIZER" || data.type === "PIECE") {
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
    }
  })
  .passthrough()

export type EventFormData = z.infer<typeof eventFormSchema>

// Backwards-compat exports for existing imports
export const performanceSchema = eventFormSchema
export type PerformanceFormData = EventFormData

// Optional: export these if your UI blocks want them
export { occurrenceSchema, occurrencesSchema, extraDateSchema, extraTimeSchema }
