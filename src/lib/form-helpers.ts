import type { SignupFormData } from "@/lib/validations/signup"
import type { EventFormData } from "@/lib/validations/events"

const FIELD_LABELS: Record<keyof SignupFormData, string> = {
  profile_type: "Profile Type",
  name: "Name",
  email: "Email",
  pronouns: "Pronouns",
  website: "Website",
  organization_name: "Organization Name",
  location_place_id: "Location",
  location_label: "Location Label",
  newsletter_ear_opt_in: "EAR newsletter",
  newsletter_calendar_opt_in: "Calendar newsletter",
  referral_source: "Referral source",
  referral_source_other: "Referral source (other)",
  self_identifies_emerging: "Artist identification",
  operating_budget_range: "Operating Budget",
  operating_budget_other_text: "Operating Budget (other)",
  owns_or_operates_venue: "Venue ownership",
  owns_or_operates_venue_other_text: "Venue ownership (other)",
  supported_by_major_institution: "Major institution support",
  supported_by_major_institution_other_text: "Major institution support (other)",
  classes_hosted_independently: "Independent classes",
  classes_hosted_independently_other_text: "Independent classes (other)",
  has_501c3: "501c3 status",
  has_501c3_other_text: "501c3 status (other)",
  password: "Password",
  confirmPassword: "Password confirmation",
} as const

const EVENT_FIELD_LABELS: Partial<Record<keyof EventFormData, string>> = {
  title: "Title",
  description: "Description",
  organizer: "Organizer",
  link: "Link",
  price: "Price",
  occurrences: "Date & Time",
  deadlineOccurrences: "Deadline",
  address: "Address",
  venueName: "Venue Name",
  placeId: "Location",
  lat: "Latitude",
  lng: "Longitude",
  locationInstructions: "Location Instructions",
  eligibility: "Eligibility",
  instructions: "Instructions",
  compensation: "Compensation",
  fee: "Fee",
  feeAmount: "Fee Amount",
  teachers: "Teachers",
  host: "Host",
  dates: "Dates",
  requirements: "Requirements",
  company: "Company",
  companyWebsite: "Company Website",
  socialHandles: "Social Handles",
  notes: "Notes",
  credits: "Credits",
  promoImagePaths: "Promo Images",
  website: "Website",
  participants: "Participants",
  type: "Type",
  eventType: "Event Type",
  classWorkshopType: "Class/Workshop Type",
  fundingLink: "Funding Link",
  artistType: "Artist Type",
  preAuditionClasses: "Pre-Audition Classes",
  agreeCompTickets: "Comp Tickets Agreement",
  eventDatesConfirmed: "Event Dates Confirmed",
  addPiece: "Add Piece",
  parentEventMode: "Parent Event Mode",
  parentEventId: "Festival Association",
  parentEventName: "Festival Name",
  parentEventWebsite: "Parent Event Website",
  parentEventTicketLink: "Festival Ticket Link",
  parentEventContactEmail: "Festival Contact Email",
  pieceScheduleMode: "Piece Schedule",
  selectedSlots: "Selected Slots",
  extraOccurrences: "Date & Time",
  listingFeeOption: "Listing Fee Option",
  listingFeeExplanation: "Listing Fee Explanation",
  classArtistType: "Class Artist Type",
  classListingFeeOption: "Class Listing Fee Option",
  classListingFeeExplanation: "Class Listing Fee Explanation",
} as const

/**
 * Converts a signup form field name to a user-friendly label
 */
export function getFieldLabel(fieldName: keyof SignupFormData | string): string {
  if (fieldName in FIELD_LABELS) {
    return FIELD_LABELS[fieldName as keyof SignupFormData]
  }

  // Fallback: convert snake_case to Title Case
  return fieldName
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

/**
 * Converts an event form field name to a user-friendly label
 */
export function getEventFieldLabel(fieldName: keyof EventFormData | string): string {
  if (fieldName in EVENT_FIELD_LABELS && EVENT_FIELD_LABELS[fieldName as keyof EventFormData]) {
    return EVENT_FIELD_LABELS[fieldName as keyof EventFormData]!
  }

  // Fallback: convert camelCase/snake_case to Title Case
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
