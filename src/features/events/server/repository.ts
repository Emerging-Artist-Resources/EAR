import { getSupabaseServerClient } from "@/lib/supabase/server"

type CreateEventInput = {
  title: string
  date: string
  show_time: string
  status: string
  created_by: string | null
  event_type: string
  details: Record<string, unknown>
}

export async function createEventWithPhotos(input: CreateEventInput, photoUrls: string[]) {
  const supabase = await getSupabaseServerClient()

  const { data: created, error } = await supabase
    .from('events')
    .insert(input)
    .select()
    .single()

  if (error) throw error

  if (photoUrls && photoUrls.length) {
    const rows = photoUrls.slice(0, 5).map((url, idx) => ({ event_id: created.id, url, position: idx }))
    const { error: photoErr } = await supabase.from('event_photos').insert(rows)
    if (photoErr) throw photoErr
  }

  return created
}

export async function listEvents(params: { status?: string | null, userId?: string | null }) {
  const supabase = await getSupabaseServerClient()
  let query = supabase.from('events').select('*')
  if (params.status) query = query.eq('status', params.status)
  if (params.userId) query = query.eq('created_by', params.userId)
  query = query.order('date', { ascending: true })
  const { data, error } = await query
  if (error) throw error
  return data
}


