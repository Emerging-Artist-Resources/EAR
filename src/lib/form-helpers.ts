import type { SignupFormData } from "@/lib/validations/signup"

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

/**
 * Converts a field name to a user-friendly label
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
