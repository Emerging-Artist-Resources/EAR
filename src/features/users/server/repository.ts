import { getSupabaseServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { getServiceEnv } from "@/lib/env"

export async function listProfilesRepo() {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, name, role, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function upsertProfileRoleRepo(userId: string, role: 'USER' | 'ADMIN') {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, role }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function updateAuthUserRoleRepo(userId: string, role: 'USER' | 'ADMIN') {
  const { SUPABASE_URL, SERVICE_ROLE_KEY } = getServiceEnv()
  const sr = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const { error } = await sr.auth.admin.updateUserById(userId, { app_metadata: { role } })
  if (error) throw error
}


