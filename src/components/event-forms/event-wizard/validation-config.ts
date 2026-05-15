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
    "type",
    "eventType",
    "title",
    "organizer",
    "website",
    "shareRecipientEmails",
    "link",
    "price",
    "description",
    "occurrences",
    "eventDatesConfirmed",
    "addPiece",
    "piece_company",
    "piece_title",
    "piece_description",
    "piece_credits",
    "parentEventMode",
    "parentEventId",
    "parentEventName",
    "parentEventWebsite",
    "parentEventContactEmail",
    "selectedSlots",
    "extraOccurrences",
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
    "locationMode",
    "occurrences",
    "shareRecipientEmails",
  ],
  FUNDING: ["fundingLink"],
}

