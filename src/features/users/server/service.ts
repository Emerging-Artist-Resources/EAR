import {
  listProfilesRepo,
  upsertProfileRoleRepo,
  listAdminProfilesRepo,
  updateProfileStatusRepo,
  markProfileReviewedRepo,
  getAdminEligibilitySubmissionsRepo,
  updateFiscalSponsorshipStatusRepo,
} from "./repository"
import type {
  AdminProfileItem,
  ProfileStatus,
  ProfileType,
  AdminEligibilitySubmission,
  FiscalSponsorshipStatus,
} from "@/components/admin/profiles/profile-types"
import { sendProfileApprovalEmail } from "@/features/profile/server/service"
import { getSupabaseServiceClient } from "@/lib/supabase/service"

export type UserSummary = { id: string; name: string | null; email: string | null; role: 'USER' | 'ADMIN'; createdAt: string }

export async function listUsers(): Promise<UserSummary[]> {
  const rows = await listProfilesRepo() as Array<{ id: string; name: string | null; email: string | null; role: string | null; created_at: string }>
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    role: (p.role === 'admin' ? 'ADMIN' : 'USER'),
    createdAt: p.created_at,
  }))
}

export async function updateUserRole(userId: string, role: 'USER' | 'ADMIN') {
  const profileRole = role === 'ADMIN' ? 'admin' : 'user'
  await upsertProfileRoleRepo(userId, profileRole)
  return { id: userId, role }
}

type DbProfileRow = {
  id: string
  name: string | null
  email: string | null
  profile_type: string | null
  artist_status: string | null
  created_at: string
  artist_status_reviewed_at: string | null
  fiscal_sponsorship_status: FiscalSponsorshipStatus | null
  fiscal_sponsorship_approved_at: string | null
  fiscal_sponsorship_approved_by: string | null
  fiscal_sponsorship_note: string | null
}

export async function listAdminProfiles(): Promise<AdminProfileItem[]> {
  const rows = await listAdminProfilesRepo() as DbProfileRow[]
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    status: (p.artist_status === 'established' ? 'established' : 'emerging') as ProfileStatus,
    profileType: (p.profile_type === 'individual' || p.profile_type === 'company' || p.profile_type === 'festival' || p.profile_type === 'other' 
      ? p.profile_type 
      : undefined) as ProfileType | undefined,
    createdAt: p.created_at,
    reviewedAt: p.artist_status_reviewed_at,
    fiscalSponsorshipStatus: p.fiscal_sponsorship_status ?? "none",
    fiscalSponsorshipApprovedAt: p.fiscal_sponsorship_approved_at,
    fiscalSponsorshipApprovedBy: p.fiscal_sponsorship_approved_by,
    fiscalSponsorshipNote: p.fiscal_sponsorship_note,
  }))
}

export async function updateProfileStatus(userId: string, status: 'emerging' | 'established') {
  await updateProfileStatusRepo(userId, status)
  return { id: userId, status }
}

export async function markProfileReviewed(userId: string) {
  const supabase = getSupabaseServiceClient()
  
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', userId)
    .single()
  
  if (fetchError || !profile) {
    throw fetchError || new Error("Profile not found")
  }
  
  await markProfileReviewedRepo(userId)
  
  try {
    await sendProfileApprovalEmail(profile.name || null, profile.email || null, userId)
  } catch (emailError) {
    console.error("[EMAIL] Failed to send profile approval email:", emailError)
  }
  
  return { id: userId }
}

export async function updateFiscalSponsorshipStatus(
  userId: string,
  status: FiscalSponsorshipStatus,
  adminUserId: string,
  note?: string,
) {
  await updateFiscalSponsorshipStatusRepo(userId, {
    status,
    approvedAt: status === "approved" ? new Date().toISOString() : undefined,
    approvedBy: status === "approved" ? adminUserId : undefined,
    note: note?.trim() || null,
  })
  return { id: userId, fiscalSponsorshipStatus: status }
}

type DbEligibilityRow = {
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
  created_at?: string | null
  createdAt?: string | null
  submitted_at?: string | null
  version: number
}

export async function getAdminEligibilitySubmissions(userId: string): Promise<AdminEligibilitySubmission[]> {
  const rows = await getAdminEligibilitySubmissionsRepo(userId) as DbEligibilityRow[]
  return rows.map((row) => {
    const createdAt = row.created_at || row.createdAt || row.submitted_at || new Date().toISOString()
    return {
      id: row.id,
      profile_id: row.profile_id,
      self_identifies_emerging: row.self_identifies_emerging,
      operating_budget_range: row.operating_budget_range,
      operating_budget_other_text: row.operating_budget_other_text,
      owns_or_operates_venue: row.owns_or_operates_venue,
      owns_or_operates_venue_other_text: row.owns_or_operates_venue_other_text,
      supported_by_major_institution: row.supported_by_major_institution,
      supported_by_major_institution_other_text: row.supported_by_major_institution_other_text,
      classes_hosted_independently: row.classes_hosted_independently,
      classes_hosted_independently_other_text: row.classes_hosted_independently_other_text,
      has_501c3: row.has_501c3,
      has_501c3_other_text: row.has_501c3_other_text,
      suggested_status: row.suggested_status,
      decision: row.decision,
      final_status: row.final_status,
      reviewed_at: row.reviewed_at,
      created_at: createdAt,
      version: row.version,
    }
  })
}


