import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseServerClientAnon } from "@/lib/supabase/serverAnon"

// PUBLIC
export async function listAnnouncementsRepo(limit = 20) {
  // For public (active=true) queries, use anon client to avoid cookie-bound auth issues
    const anonClient = getSupabaseServerClientAnon()
    const { data, error } = await anonClient
      .from('announcements')
      .select('id,title,content,published_at, type')
      .is('archived_at', null)
      .not('published_at', 'is', null)
      .limit(limit)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
}

export async function listAnnouncementsRepoAdmin() {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('announcements')
    .select('id,title,content,published_at,archived_at,author_user_id,type,created_at')
    .order('created_at', { ascending: false })
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


