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
    "title", // First field in OrganizerBasics
    "organizer", // Second field in OrganizerBasics
    "link", // Third field in OrganizerBasics
    "price", // Fourth field in OrganizerBasics
    "description", // Fifth field in OrganizerBasics
    "occurrences", // In OrganizerSoloForm or OrganizerMultiProgramForm
    // PIECE fields (if type === "PIECE")
    "parentEventId", // In PieceSubmissionFlow - "Find Your Event" section (if parentEventMode === "SELECT")
    "parentEventName", // In PieceSubmissionFlow - "Basic event info" section (if parentEventMode === "MANUAL")
    "selectedSlots", // In PieceSubmissionFlow - "Piece Details" section (if pieceScheduleMode === "FROM_PARENT")
    "extraOccurrences", // In PieceSubmissionFlow - "Piece Details" section (if pieceScheduleMode === "CUSTOM")
  ],
  AUDITION: [
    "title", // First field in AuditionStep - Audition Details section
    "description", // Second field
    "eligibility", // Third field
    "compensation", // Fourth field
    "instructions", // Fifth field
    "fee", // Sixth field
    "feeAmount", // Conditional field (shown if fee === "FEE")
    "occurrences", // In Key Dates section
    "deadlineOccurrences", // In Key Dates section
    "address", // In Location section
  ],
  CREATIVE: [
    "title", // First field in OpportunityStep - Creative Opportunity Details section
    "host", // Second field
    "dates", // Third field
    "description", // Fourth field
    "compensation", // Fifth field
    "requirements", // Sixth field
    "link", // Seventh field
    "deadlineOccurrences", // Eighth field
    "fee", // Ninth field
    "feeAmount", // Conditional field (shown if fee === "FEE")
    "address", // In Location section
  ],
  CLASS: [
    "classWorkshopType", // First field in ClassesWorkshopsStep - What are you submitting? section
    "title", // First field in Basic Info section
    "organizer", // Second field in Basic Info
    "price", // Third field in Basic Info (required for CLASS, optional for WORKSHOP)
    "link", // Fourth field in Basic Info (required for CLASS, optional for WORKSHOP)
    "description", // Fifth field in Basic Info
    "occurrences", // In Schedule section
  ],
  FUNDING: ["fundingLink"],
}

