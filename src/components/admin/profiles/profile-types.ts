import type { FiscalSponsorshipStatus } from "@/lib/types/fiscal-sponsorship"

export type ProfileStatus = "emerging" | "established"
export type ProfileType = "individual" | "company" | "festival" | "other"
export type { FiscalSponsorshipStatus }

export interface AdminProfileItem {
  id: string
  name: string | null
  email: string | null
  status: ProfileStatus
  profileType?: ProfileType
  createdAt: string
  updatedAt?: string
  reviewedAt?: string | null
  fiscalSponsorshipStatus: FiscalSponsorshipStatus
  fiscalSponsorshipApprovedAt?: string | null
  fiscalSponsorshipApprovedBy?: string | null
  fiscalSponsorshipNote?: string | null
}

export const STATUS_BADGE: Record<ProfileStatus, string> = {
  emerging: "bg-[var(--warning-50)] text-[var(--warning-600)]",
  established: "bg-[var(--success-50)] text-[var(--success-600)]",
}

export const FISCAL_STATUS_BADGE: Record<FiscalSponsorshipStatus, string> = {
  none: "bg-[var(--gray-100)] text-[var(--gray-700)]",
  pending: "bg-[var(--warning-50)] text-[var(--warning-700)]",
  approved: "bg-[var(--success-50)] text-[var(--success-700)]",
  paused: "bg-[var(--warning-50)] text-[var(--warning-700)]",
  revoked: "bg-[var(--error-50)] text-[var(--error-700)]",
}

// Helper function to check if a profile is new (created within last 72 hours)
export function isNewProfile(profile: AdminProfileItem): boolean {
  const createdAt = new Date(profile.createdAt).getTime()
  const now = Date.now()
  const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60)
  return hoursSinceCreation <= 72 && !profile.reviewedAt
}

// Helper function to check if a profile needs review
export function needsReview(profile: AdminProfileItem): boolean {
  return isNewProfile(profile) && !profile.reviewedAt
}

export interface AdminEligibilitySubmission {
  id: string
  profile_id: string
  self_identifies_emerging: boolean | null
  operating_budget_range: string | null
  operating_budget_other_text: string | null
  owns_or_operates_venue: string | null
  owns_or_operates_venue_other_text: string | null
  supported_by_major_institution: string | null
  supported_by_major_institution_other_text: string | null
  classes_hosted_independently: string | null
  classes_hosted_independently_other_text: string | null
  has_501c3: string | null
  has_501c3_other_text: string | null
  suggested_status: string | null
  decision: string | null
  final_status: string | null
  reviewed_at: string | null
  created_at: string
  version: number
}
