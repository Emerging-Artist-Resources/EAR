import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/authz"
import { reviewEvent } from "@/features/reviews/server/service"

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = getUserRole(user)
    if (!user?.id || role !== 'ADMIN') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
    }

    const { eventId, decision, notes } = await request.json()

    if (!eventId || !decision) return NextResponse.json({ error: { code: 'INVALID_INPUT' } }, { status: 400 })

    if (!['APPROVED','REJECTED'].includes(decision)) return NextResponse.json({ error: { code: 'INVALID_INPUT' } }, { status: 400 })

    const review = await reviewEvent({
      eventId,
      decision,
      notes: notes ?? null,
      reviewerUserId: user.id,
    })
    return NextResponse.json({ data: review }, { status: 201 })
  } catch (error) {
    console.error("Review creation error:", error)
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}
