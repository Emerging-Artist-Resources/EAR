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
    "shortDescription",
    "credits",
    "ticketPrice",
    "extraOccurrences",
  ],
  AUDITION: [
    "auditionName",
    "aboutProject",
    "eligibility",
    "compensation",
    "auditionDate",
    "auditionTime",
    "auditionLink",
  ],
  CREATIVE: [
    "opportunityName",
    "briefDescription",
    "creativeEligibility",
    "whatsOffered",
    "stipendAmount",
    "requirements",
    "deadline",
    "applyLink",
  ],
  CLASS: [
    "className",
    "classDates",
    "classTimes",
    "classPrices",
    "classLink",
    "classDescription",
    "classCreditInfo",
  ],
  FUNDING: ["fundingLink"],
}

