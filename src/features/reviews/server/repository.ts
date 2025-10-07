import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function insertReviewRepo(input: {
  eventId: string
  decision: 'APPROVED' | 'REJECTED'
  notes: string | null
  reviewerUserId: string
}) {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      event_id: input.eventId,
      decision: input.decision,
      notes: input.notes,
      reviewer_user_id: input.reviewerUserId,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateEventStatusRepo(eventId: string, decision: 'APPROVED' | 'REJECTED', approverUserId: string) {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('events')
    .update({
      status: decision,
      approved_by: approverUserId,
      approved_at: new Date(),
    })
    .eq('id', eventId)
  if (error) throw error
}

export async function ensureEventExistsRepo(eventId: string) {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase.from('events').select('id').eq('id', eventId).single()
  if (error || !data) throw new Error('Event not found')
}


