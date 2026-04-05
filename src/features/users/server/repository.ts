import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseServiceClient } from "@/lib/supabase/service"

export async function listProfilesRepo() {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, profile_type, artist_status, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function upsertProfileRoleRepo(userId: string, role: 'user' | 'admin') {
  const supabase = getSupabaseServiceClient()
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
  if (error) throw error
}

export async function listAdminProfilesRepo() {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, profile_type, artist_status, created_at, artist_status_reviewed_at, fiscal_sponsorship_status, fiscal_sponsorship_approved_at, fiscal_sponsorship_approved_by, fiscal_sponsorship_note')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateProfileStatusRepo(userId: string, status: 'emerging' | 'established') {
  const supabase = getSupabaseServiceClient()
  const { error } = await supabase
    .from('profiles')
    .update({ artist_status: status })
    .eq('id', userId)
  if (error) throw error
}

export async function markProfileReviewedRepo(userId: string) {
  const supabase = getSupabaseServiceClient()
  const { error } = await supabase
    .from('profiles')
    .update({ artist_status_reviewed_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw error
}

export async function updateFiscalSponsorshipStatusRepo(
  userId: string,
  updates: {
    status: "none" | "pending" | "approved" | "paused" | "revoked"
    approvedAt?: string | null
    approvedBy?: string | null
    note?: string | null
  },
) {
  const supabase = getSupabaseServiceClient()
  const payload: Record<string, string | null> = {
    fiscal_sponsorship_status: updates.status,
    fiscal_sponsorship_note: updates.note ?? null,
    updated_at: new Date().toISOString(),
  }

  if (updates.status === "approved") {
    payload.fiscal_sponsorship_approved_at = updates.approvedAt ?? new Date().toISOString()
    payload.fiscal_sponsorship_approved_by = updates.approvedBy ?? null
  }

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId)
  if (error) throw error
}

export async function getAdminEligibilitySubmissionsRepo(userId: string) {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('emerging_eligibility_submissions')
    .select('*')
    .eq('profile_id', userId)
    .order('id', { ascending: false })
  if (error) throw error
  return data
}


