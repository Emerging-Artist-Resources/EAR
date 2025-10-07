import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function listAnnouncementsRepo(params: { active?: boolean | null }) {
  const supabase = await getSupabaseServerClient()
  let query = supabase.from('announcements').select('*')
  if (params.active) {
    // Active = published and not archived
    query = query.is('archived_at', null).not('published_at', 'is', null)
  }
  query = query.order('created_at', { ascending: false })
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getAnnouncementRepo(id: string) {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase.from('announcements').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createAnnouncementRepo(payload: {
  title: string
  content: string
  type: string
  author_user_id: string
  published_at?: string | Date | null
  archived_at?: string | Date | null
}) {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase.from('announcements').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateAnnouncementRepo(id: string, updatePayload: Record<string, unknown>) {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('announcements')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteAnnouncementRepo(id: string) {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) throw error
}


