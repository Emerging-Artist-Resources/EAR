import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

function getUserRole(user: unknown): 'ADMIN' | 'USER' | undefined {
  if (!user || typeof user !== 'object') return undefined
  const u = user as { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }
  const fromApp = u.app_metadata?.role as unknown
  const fromUser = u.user_metadata?.role as unknown
  const val = (fromApp ?? fromUser)
  return val === 'ADMIN' || val === 'USER' ? val : undefined
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = getUserRole(user)
    if (!user?.id || role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId, decision, notes } = await request.json()

    if (!eventId || !decision) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['APPROVED','REJECTED'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
    }

    // Ensure event exists
    const { data: existing, error: fetchErr } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .single()

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Create review record
    const { data: review, error: reviewErr } = await supabase
      .from('reviews')
      .insert({
        event_id: eventId,
        decision,
        notes: notes ?? null,
        reviewer_user_id: user.id,
      })
      .select()
      .single()

    if (reviewErr) {
      console.error('Supabase review insert error:', reviewErr)
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
    }

    // Update event status and approver info
    const { error: updateErr } = await supabase
      .from('events')
      .update({
        status: decision === 'APPROVED' ? 'APPROVED' : 'REJECTED',
        approved_by: user.id,
        approved_at: new Date(),
      })
      .eq('id', eventId)

    if (updateErr) {
      console.error('Supabase event update error:', updateErr)
      return NextResponse.json({ error: 'Review created, but failed to update event' }, { status: 500 })
    }

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error("Review creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
