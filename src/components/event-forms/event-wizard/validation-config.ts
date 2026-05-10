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
    "title", // First field in OpportunityStep - Creative Opportunity Details section
    "host", // Second field
    "dates", // Third field
    "description", // Fourth field
    "compensation", // Fifth field
    "requirements", // Sixth field
    "listingWebsite",
    "creativeSubmissionInstructions", // Seventh field (free text; not URL — see creativeFields)
    "deadlineOccurrences", // Eighth field
    "fee", // Ninth field
    "feeAmount", // Conditional field (shown if fee === "FEE")
    "address", // In Location section
  ],
  CLASS: [
    "classWorkshopType", // First field - What are you submitting? section
    "title", // First field in Basic Info section
    "organizer", // Second field in Basic Info
    "price", // Third field in Basic Info (required for CLASS only, optional for WORKSHOP)
    "classRegistrationDetails", // Registration link or instructions (required for CLASS only)
    "listingWebsite",
    "description", // Fifth field in Basic Info
    "dropInClassesAvailable", // Workshop: drop-in yes/no (before schedule)
    "dropInClasses", // Workshop: drop-in details when Yes
    "isPartOfFestivalOrWorkshop", // In Festival or Workshop Association section (required for CLASS only)
    "parentEventId", // In FestivalAssociationSection (required if YES and not creating placeholder, CLASS only)
    "placeholderTitle", // In FestivalAssociationSection (required if YES and creating placeholder, CLASS only)
    "occurrences", // In Schedule section (required for both CLASS and WORKSHOP)
    "shareRecipientEmails", // After schedule, workshop-only (ShareListingSection)
  ],
  FUNDING: ["fundingLink"],
}

