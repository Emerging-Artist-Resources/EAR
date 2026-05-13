import { EventFormData } from "@/lib/validations/events"
import { EventType } from "./EventTypeSelector"

export type FieldPath<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${FieldPath<T[K]>}`
          : K
        : never
    }[keyof T]
  : never

// Configuration for step validation per event type
// Fields are ordered to match the form field order for consistent error display
export const eventTypeValidationFields: Record<
  EventType,
  Array<keyof EventFormData>
> = {
  PERFORMANCE: [
    "type", // First field in PerformanceDetailsStep - "What are you submitting?" section
    // ORGANIZER fields (if type === "ORGANIZER")
    "eventType", // First field in OrganizerBasics - "Is this a solo show, split bill, or festival?"
    "title", // Second field in OrganizerBasics
    "organizer", // Third field in OrganizerBasics
    "link", // Fourth field in OrganizerBasics
    "price", // Fifth field in OrganizerBasics
    "description", // Sixth field in OrganizerBasics
    "occurrences", // In OrganizerSoloForm or OrganizerMultiProgramForm
    // PIECE fields (if type === "PIECE")
    "parentEventId", // In PieceSubmissionFlow - "Find Your Event" section (if parentEventMode === "SELECT")
    "parentEventName", // In PieceSubmissionFlow - "Basic event info" section (if parentEventMode === "MANUAL")
    "selectedSlots", // In PieceSubmissionFlow - "Piece Details" section (if pieceScheduleMode === "FROM_PARENT" and parentEventId exists)
    "extraOccurrences", // In PieceSubmissionFlow - "Piece Details" section (if pieceScheduleMode === "CUSTOM" or parentEventMode === "MANUAL")
    "piece_company", // In PieceSubmissionFlow - Piece Details section
    "piece_title", // In PieceSubmissionFlow - Piece Details section
    "piece_description", // In PieceSubmissionFlow - Piece Details section
    "piece_credits", // In PieceSubmissionFlow - Piece Details section
  ],
  AUDITION: [
    "title", // First field in AuditionStep - Audition Details section
    "description", // Second field
    "eligibility", // Third field
    "compensation", // Fourth field
    "instructions", // Fifth field
    "listingWebsite",
    "fee", // Sixth field
    "feeAmount", // Conditional field (shown if fee === "FEE")
    "occurrences", // In Key Dates section
    "deadlineOccurrences", // In Key Dates section
    "address", // In Location section
  ],
  CREATIVE: [
    "title",
    "host",
    "listingWebsite",
    "dates",
    "description",
    "compensation",
    "requirements",
    "creativeSubmissionInstructions",
    "deadlineOccurrences",
    "fee",
    "feeAmount",
    "address",
  ],
  CLASS: [
    "classWorkshopType",
    "title",
    "organizer",
    "description",
    "classWorkshopDuration",
    "price",
    "classRegistrationDetails",
    "listingWebsite",
    "workshopDetails",
    "classesOffered",
    "dropInClassesAvailable",
    "dropInClasses",
    "isPartOfFestivalOrWorkshop",
    "parentEventId",
    "placeholderTitle",
    "placeholderOrganizerName",
    "placeholderContactEmail",
    "placeholderStartDate",
    "placeholderEndDate",
    "placeholderWebsiteOrSocial",
    "occurrences",
    "shareRecipientEmails",
  ],
  FUNDING: ["fundingLink"],
}

