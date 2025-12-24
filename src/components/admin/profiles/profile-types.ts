export type ProfileStatus = "emerging" | "established"
export type ProfileType = "individual" | "company" | "festival" | "other"

export interface AdminProfileItem {
  id: string
  name: string | null
  email: string | null
  status: ProfileStatus
  profileType?: ProfileType
  createdAt: string
  updatedAt?: string
  reviewedAt?: string | null
}

export const STATUS_BADGE: Record<ProfileStatus, string> = {
  emerging: "bg-[var(--warning-50)] text-[var(--warning-600)]",
  established: "bg-[var(--success-50)] text-[var(--success-600)]",
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

