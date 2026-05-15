import { z } from "zod"
import { flexibleUrlRequiredSchema } from "../flexible-url"
import { baseSchema, refineOccurrenceTimeSlotEndAfterStart } from "./base"
import { performanceFields } from "./performance"
import {
  addOrganizerListingScheduleIssues,
  addOrganizerMultiProgramPieceSlotAndCustomIssues,
  resolveOrganizerOccurrencesForValidation,
} from "./organizer-performance-schedule"
import { auditionFields } from "./audition"
import { creativeFields } from "./creative"
import { classFields } from "./class"
import {
  inferOrganizerPieceCount,
  organizerPieceHasSchedule,
  pieceFieldPrefix,
} from "@/lib/organizer-program-pieces"

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
    const hasCreativeFields = !!(
      data.host &&
      data.dates &&
      data.requirements &&
      data.creativeSubmissionInstructions
    )
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
    const hasCreativeFields = !!(
      data.host &&
      data.dates &&
      data.requirements &&
      data.creativeSubmissionInstructions
    )
    
    const isAudition = hasDeadlineOccurrences && hasAuditionFields && !hasCreativeFields && !data.type
    
    // Creative opportunities have deadlineOccurrences AND creative-specific fields
    const isCreative = hasDeadlineOccurrences && hasCreativeFields && !data.type
    
    // Only validate occurrences for types that definitely need it
    // Skip validation for creative opportunities (they only use deadlineOccurrences)
    // Skip validation for PIECE type - it has its own validation logic that checks extraOccurrences/selectedSlots
    // Skip ORGANIZER — performanceFields / performanceStep2Schema enforce showtime rows + confirmation
    const isPiece = data.type === "PIECE"
    if (
      (isPerformance || isClass || isAudition) &&
      !isCreative &&
      !isPiece &&
      data.type !== "ORGANIZER"
    ) {
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
      // Emerging artists: platform listing fee waived (no listingFeeOption / comp / waiver).
    }
    
    // Ticket link format is enforced by flexible URL preprocessing + zod on performanceFields.link
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
    eventDatesConfirmed: true,
    type: true,
    eventType: true, // Required for ORGANIZER flow
    parentEventMode: true, // Required for PIECE flow to determine validation logic
    pieceScheduleMode: true,
    selectedSlots: true,
    parentEventId: true,
    parentEventName: true,
    parentEventWebsite: true,
    parentEventContactEmail: true,
    shareRecipientEmails: true,
    addPiece: true,
    website: true,
    piece_company: true,
    piece_companyWebsite: true,
    piece_title: true,
    piece_choreographer: true,
    piece_description: true,
    piece_credits: true,
    pieces: true,
    piece_id: true,
    piece_selectedSlots: true,
    piece_pieceScheduleMode: true,
    piece_extraOccurrences: true,
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
        message: "Please select your role",
      })
      return // Don't continue validation if type is missing
    }
    
    // Preserve performance-specific validation logic
    if (data.type === "ORGANIZER") {
      // Note: eventType validation is handled in the main schema
      // Step 2 focuses on fields shown in step 2 (eventType is in step 2, but validation happens at full form level)
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
          message:
            (data.eventType ?? "SOLO") === "SOLO"
              ? "Company / artist name is required"
              : "Organizer / presenting company is required",
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
      const organizerOccs = resolveOrganizerOccurrencesForValidation(
        data.occurrences,
        data.extraOccurrences,
      )
      addOrganizerListingScheduleIssues(ctx, {
        occurrences: organizerOccs,
        eventType: data.eventType,
        eventDatesConfirmed: data.eventDatesConfirmed,
      })
      if (data.eventType === "SPLIT_BILL" || data.eventType === "FESTIVAL") {
        if (data.addPiece === true) {
          const raw = data as Record<string, unknown>
          const n = inferOrganizerPieceCount(raw)
          if (n === 0) {
            ctx.addIssue({
              code: "custom",
              path: ["addPiece"],
              message: "Add at least one piece or choose No for presenting work",
            })
          }
          for (let i = 0; i < n; i++) {
            const p = pieceFieldPrefix(i)
            const company = (raw[`${p}_company`] as string | undefined)?.trim() ?? ""
            const title = (raw[`${p}_title`] as string | undefined)?.trim() ?? ""
            const description = (raw[`${p}_description`] as string | undefined)?.trim() ?? ""
            if (!company) {
              ctx.addIssue({
                code: "custom",
                path: [i === 0 ? "piece_company" : `${p}_company`],
                message: "Company / artist name is required when you are presenting work",
              })
            }
            if (!title) {
              ctx.addIssue({
                code: "custom",
                path: [i === 0 ? "piece_title" : `${p}_title`],
                message: "Piece title is required when you are presenting work",
              })
            }
            if (!description) {
              ctx.addIssue({
                code: "custom",
                path: [i === 0 ? "piece_description" : `${p}_description`],
                message: "Piece description is required when you are presenting work",
              })
            }
            if (!organizerPieceHasSchedule(raw, i)) {
              ctx.addIssue({
                code: "custom",
                path: [i === 0 ? "piece_selectedSlots" : `${p}_selectedSlots`],
                message: "Select at least one date/time for this piece, or add custom dates & times",
              })
            }
          }
          if (n > 0) {
            addOrganizerMultiProgramPieceSlotAndCustomIssues(ctx, {
              raw,
              pieceCount: n,
              organizerOccurrences: organizerOccs,
              eventDatesConfirmed: data.eventDatesConfirmed,
              eventType: data.eventType,
            })
          }
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
            message: "Event title is required",
          })
        }
      }

      // 2. Piece detail fields (before schedule in the form)
      if (!data.piece_company || data.piece_company.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["piece_company"],
          message: "Company / artist name is required",
        })
      }
      if (!data.piece_title || data.piece_title.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["piece_title"],
          message: "Piece title is required",
        })
      }
      if (!data.piece_description || data.piece_description.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["piece_description"],
          message: "Piece description is required",
        })
      }

      // 3. Piece schedule (performance times & location)
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
    listingWebsite: true,
    dates: true,
    description: true,
    compensation: true,
    requirements: true,
    creativeSubmissionInstructions: true,
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
        message: "Opportunity name is required",
      })
    }
    if (!data.host || data.host.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["host"],
        message: "Hosting organization or individual(s) is required",
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
        message: "Opportunity description is required",
      })
    }
    if (!data.compensation || data.compensation.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["compensation"],
        message: "What is offered is required",
      })
    }
    if (!data.requirements || data.requirements.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["requirements"],
        message: "Application requirements are required",
      })
    }
    if (!data.creativeSubmissionInstructions || data.creativeSubmissionInstructions.trim() === "") {
      ctx.addIssue({
        code: "custom",
        path: ["creativeSubmissionInstructions"],
        message: "Submission instructions are required",
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
        message: "Application fee (Yes/No) is required",
      })
    }
    // Conditional validation for fee (matches form order - feeAmount shown after fee)
    if (data.fee === "FEE") {
      if (!data.feeAmount || data.feeAmount.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["feeAmount"],
          message: "Application fee amount is required when you selected Yes",
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
  .merge(performanceFields.pick({ shareRecipientEmails: true }))
  .pick({
    title: true,
    description: true,
    organizer: true,
    price: true,
    teachers: true,
    occurrences: true,
    classWorkshopType: true,
    classWorkshopDuration: true,
    isPartOfFestivalOrWorkshop: true,
    parentEventId: true,
    placeholderTitle: true,
    placeholderOrganizerName: true,
    placeholderContactEmail: true,
    placeholderWebsiteOrSocial: true,
    placeholderStartDate: true,
    placeholderEndDate: true,
    address: true,
    venueName: true,
    placeId: true,
    lat: true,
    lng: true,
    locationInstructions: true,
    shareRecipientEmails: true,
    classRegistrationDetails: true,
    listingWebsite: true,
    workshopDetails: true,
    classesOffered: true,
    dropInClassesAvailable: true,
    dropInClasses: true,
  })
  .passthrough()
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

    const duration = data.classWorkshopDuration?.trim() ?? ""
    if (!duration) {
      ctx.addIssue({
        code: "custom",
        path: ["classWorkshopDuration"],
        message: "Duration is required",
      })
    }

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

      if (!data.isPartOfFestivalOrWorkshop || (data.isPartOfFestivalOrWorkshop !== "YES" && data.isPartOfFestivalOrWorkshop !== "NO")) {
        ctx.addIssue({
          code: "custom",
          path: ["isPartOfFestivalOrWorkshop"],
          message: "Please indicate whether this class is part of a festival or workshop",
        })
      } else if (data.isPartOfFestivalOrWorkshop === "YES") {
        const hasParentId = !!data.parentEventId && data.parentEventId.trim() !== ""
        const creatingPlaceholder = !!(data.placeholderTitle && data.placeholderTitle.trim() !== "")

        if (!hasParentId && !creatingPlaceholder) {
          ctx.addIssue({
            code: "custom",
            path: ["parentEventId"],
            message: "Select an existing festival/workshop or enter event details manually",
          })
        }

        if (!hasParentId && creatingPlaceholder) {
          if (!data.placeholderOrganizerName || data.placeholderOrganizerName.trim() === "") {
            ctx.addIssue({
              code: "custom",
              path: ["placeholderOrganizerName"],
              message: "Organizer name is required",
            })
          }
          if (!data.placeholderContactEmail || data.placeholderContactEmail.trim() === "") {
            ctx.addIssue({
              code: "custom",
              path: ["placeholderContactEmail"],
              message: "Contact email is required",
            })
          }
          if (!data.placeholderStartDate || data.placeholderStartDate.trim() === "") {
            ctx.addIssue({
              code: "custom",
              path: ["placeholderStartDate"],
              message: "Start date is required",
            })
          }
          if (!data.placeholderEndDate || data.placeholderEndDate.trim() === "") {
            ctx.addIssue({
              code: "custom",
              path: ["placeholderEndDate"],
              message: "End date is required",
            })
          }
        }
      }
    } else {
      if (!data.price || data.price.trim() === "") {
        ctx.addIssue({ code: "custom", path: ["price"], message: "Price is required" })
      }
      const regW = data.classRegistrationDetails?.trim() ?? ""
      if (!regW) {
        ctx.addIssue({
          code: "custom",
          path: ["classRegistrationDetails"],
          message: "Registration link is required",
        })
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
      const avail = data.dropInClassesAvailable
      if (avail !== "YES" && avail !== "NO") {
        ctx.addIssue({
          code: "custom",
          path: ["dropInClassesAvailable"],
          message: "Select whether drop-in classes are available",
        })
      } else if (avail === "YES") {
        const detail = data.dropInClasses?.trim() ?? ""
        if (!detail) {
          ctx.addIssue({
            code: "custom",
            path: ["dropInClasses"],
            message: "Describe drop-in pricing or details",
          })
        }
      }

      const emails = data.shareRecipientEmails
      if (emails) {
        emails.forEach((e, i) => {
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

// Funding step 2 schema (minimal - only fundingLink)
export const fundingStep2Schema = z.object({
  fundingLink: flexibleUrlRequiredSchema("Invalid URL", "Funding link is required"),
}).passthrough()

// Backwards-compat exports for existing imports
export const performanceSchema = eventFormSchema
export type PerformanceFormData = EventFormData

// Optional: export these if your UI blocks want them
export {
  occurrenceSchema,
  occurrencesSchema,
  extraDateSchema,
  extraTimeSchema,
  refineOccurrenceTimeSlotEndAfterStart,
} from "./base"
