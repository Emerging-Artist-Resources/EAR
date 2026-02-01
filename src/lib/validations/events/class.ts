import { z } from "zod"
import { occurrenceSchema, occurrencesSchema } from "./base"

// Class / Workshop-only
export const classFields = z
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
     * Note: Using z.array() without .min() to allow empty arrays.
     * Validation requiring at least one occurrence is done conditionally in superRefine based on event type.
     */
    occurrences: z.array(occurrenceSchema).optional(),
    classOccurrences: occurrencesSchema.optional(), // Legacy support (keep occurrencesSchema for backward compat)

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
    placeholderContactEmail: z.string().optional().refine(
      (val) => !val || z.string().email().safeParse(val).success,
      { message: "Invalid email address" }
    ),
    placeholderWebsiteOrSocial: z.string().optional(),
    placeholderStartDate: z.string().optional().refine(
      (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
      { message: "Use YYYY-MM-DD" }
    ),
    placeholderEndDate: z.string().optional().refine(
      (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
      { message: "Use YYYY-MM-DD" }
    ),

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
    // Removed global venueName requirement - classes use per-occurrence locations

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
