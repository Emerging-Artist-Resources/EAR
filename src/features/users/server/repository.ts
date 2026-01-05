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


