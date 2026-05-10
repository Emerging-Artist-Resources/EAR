import { z } from "zod"
import { flexibleUrlOptionalSchema } from "../flexible-url"
import {
  occurrenceSchema,
  refineOccurrenceTimeSlotEndAfterStart,
  lenientOccurrenceTimeSlotSchema,
} from "./base"

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
    /**
     * Registration URL and/or free-text signup instructions (DB: class_workshop_details.link).
     * Separate from performance `link` (ticket URL) so class text does not override merged URL schema.
     */
    classRegistrationDetails: z
      .string()
      .max(2000, "Registration details must be 2000 characters or less")
      .optional(),
    /** Class/workshop website (DB: class_workshop_details.website) */
    listingWebsite: flexibleUrlOptionalSchema,
    teachers: z.string().optional(),
    styleCategory: z.string().optional(), // or z.enum([...]) if you want strict options
    venueName: z.string().optional(),

    /**
     * NEW: use canonical occurrences shape for schedule
     * (dates-only; no recurring logic needed)
     * Note: Using z.array() without .min() to allow empty arrays.
     * Validation requiring at least one occurrence is done conditionally in superRefine based on event type.
     */
    occurrences: z.array(
      occurrenceSchema.extend({
        date: z.string().optional(),
        times: z.array(lenientOccurrenceTimeSlotSchema).optional(),
      })
    ).optional(),

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
    festivalLink: flexibleUrlOptionalSchema,
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
    classLink: z.string().max(2000).optional(),
    classDescription: z.string().max(2000).optional(),
    classCreditInfo: z.string().optional(),
    classRecurrence: z.string().optional(),
    classTitle: z.string().optional(), // Legacy
    shortDescription: z.string().optional(), // Legacy

    /**
     * Class/Workshop listing fee fields (shared field names)
     * Established: platform listing fee (automatic).
     * Emerging: waived server-side; these fields stay null for EMERGING profiles.
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

    const isClass = data.classWorkshopType === "CLASS"

    // Basic Info section - required for both CLASS and WORKSHOP
    if (!data.title || data.title.trim() === "") {
      ctx.addIssue({ code: "custom", path: ["title"], message: "Title is required" })
    }
    if (!data.organizer || data.organizer.trim() === "") {
      ctx.addIssue({ code: "custom", path: ["organizer"], message: "Organizer is required" })
    }
    if (!data.description || data.description.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["description"],
        message: "Description is required",
      })
    }

    // CLASS-specific fields (price and registration details are optional for WORKSHOP)
    if (isClass) {
      if (!data.price || data.price.trim() === "") {
        ctx.addIssue({ code: "custom", path: ["price"], message: "Price is required" })
      }
      const reg = data.classRegistrationDetails?.trim() ?? ""
      if (!reg) {
        ctx.addIssue({
          code: "custom",
          path: ["classRegistrationDetails"],
          message: "Registration link or instructions are required",
        })
      }
      
      // Festival or Workshop Association (only for CLASS)
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

    // Occurrences validation (required for both CLASS and WORKSHOP)
    const normalizedOccurrences = data.occurrences && data.occurrences.length > 0
      ? data.occurrences
      : undefined

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
          // Report error for each occurrence missing location
          occurrencesWithMissingLocation.forEach(({ index }) => {
            ctx.addIssue({
              code: "custom",
              path: ["occurrences", index, "address"],
              message: "Location is required for each date & time",
            })
          })
        }
      }

      for (let i = 0; i < normalizedOccurrences.length; i++) {
        const occ = normalizedOccurrences[i]
        if (!occ?.times?.length) continue
        for (let j = 0; j < occ.times.length; j++) {
          refineOccurrenceTimeSlotEndAfterStart(occ.times[j], ctx, ["occurrences", i, "times", j])
        }
      }
    }

    if (data.classWorkshopType === "WORKSHOP") {
      const emails = (data as { shareRecipientEmails?: string[] }).shareRecipientEmails
      if (emails) {
        emails.forEach((e: string, i: number) => {
          const t = (e ?? "").trim()
          if (t === "") return
          if (!z.string().email().safeParse(t).success) {
            ctx.addIssue({
              code: "custom",
              path: ["shareRecipientEmails", i],
              message: "Invalid email address",
            })
          }
        })
      }
    }
  })
