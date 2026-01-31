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
export const eventTypeValidationFields: Record<
  EventType,
  Array<keyof EventFormData>
> = {
  PERFORMANCE: [
    "title",
    "description",
    "organizer",
    "link",
    "price",
    "occurrences",
  ],
  AUDITION: [
    "title",
    "description",
    "eligibility",
    "compensation",
    "instructions",
    "occurrences",
    "deadlineOccurrences",
    "fee",
    "address",
  ],
  CREATIVE: [
    "title",
    "description",
    "host",
    "dates",
    "compensation",
    "requirements",
    "link",
    "deadlineOccurrences",
    "fee",
  ],
  CLASS: [
    "title",
    "description",
    "organizer",
    "price",
    "link",
    "teachers",
    "occurrences",
  ],
  FUNDING: ["fundingLink"],
}

