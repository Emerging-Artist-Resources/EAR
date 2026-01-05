import { getSupabaseServiceClient } from "@/lib/supabase/service"
import type { SignupFormData } from "@/lib/validations/signup"

export async function createProfileRepo(data: SignupFormData, userId: string) {
  const supabase = getSupabaseServiceClient()
  
  const suggestedStatus = calculateSuggestedStatus(data)
  const artistStatus = suggestedStatus || "emerging"
  
  const profileData = {
    id: userId,
    role: "user" as const,
    profile_type: data.profile_type,
    name: data.name,
    email: data.email,
    pronouns: data.pronouns || null,
    website: data.website || null,
    organization_name: data.organization_name || null,
    location_place_id: data.location_place_id && typeof data.location_place_id === "string" && data.location_place_id.trim() !== "" ? data.location_place_id.trim() : null,
    location_label: data.location_label && typeof data.location_label === "string" && data.location_label.trim() !== "" ? data.location_label.trim() : null,
    newsletter_ear_opt_in: data.newsletter_ear_opt_in,
    newsletter_calendar_opt_in: data.newsletter_calendar_opt_in,
    referral_source: data.referral_source,
    referral_source_other: data.referral_source_other || null,
    artist_status: artistStatus,
    artist_status_reviewed_at: null,
    artist_status_reviewed_by: null,
    eligibility_resubmission_required_at: null,
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert(profileData, { onConflict: "id" })
    .select()
    .single()

  if (error) throw error
  return profile
}

export async function createEligibilitySubmissionRepo(
  data: SignupFormData,
  profileId: string
) {
  const supabase = getSupabaseServiceClient()

  const suggestedStatus = calculateSuggestedStatus(data)

  const eligibilityData = {
    profile_id: profileId,
    self_identifies_emerging: data.self_identifies_emerging,
    operating_budget_range: data.operating_budget_range,
    operating_budget_other_text: data.operating_budget_other_text || null,
    owns_or_operates_venue: data.owns_or_operates_venue,
    owns_or_operates_venue_other_text: data.owns_or_operates_venue_other_text || null,
    supported_by_major_institution: data.supported_by_major_institution,
    supported_by_major_institution_other_text: data.supported_by_major_institution_other_text || null,
    classes_hosted_independently: data.classes_hosted_independently,
    classes_hosted_independently_other_text: data.classes_hosted_independently_other_text || null,
    has_501c3: data.has_501c3,
    has_501c3_other_text: data.has_501c3_other_text || null,
    suggested_status: suggestedStatus,
    reviewed_at: null,
    reviewed_by: null,
    decision: null,
    decision_note: null,
    final_status: null,
    version: 1,
    change_summary: null,
  }

  const { data: submission, error } = await supabase
    .from("emerging_eligibility_submissions")
    .insert(eligibilityData)
    .select()
    .single()

  if (error) throw error
  return submission
}

function calculateSuggestedStatus(data: SignupFormData): "emerging" | "established" {
  if (!data.self_identifies_emerging) {
    return "established"
  }

  const indicators = {
    ownsVenue: data.owns_or_operates_venue === "yes",
    majorInstitution: data.supported_by_major_institution === "yes",
    has501c3: data.has_501c3 === "yes",
    largeBudget: ["r_1000000_1999999", "r_2000000_plus"].includes(data.operating_budget_range),
  }

  const establishedCount = Object.values(indicators).filter(Boolean).length

  if (establishedCount >= 2) {
    return "established"
  }

  return "emerging"
}

