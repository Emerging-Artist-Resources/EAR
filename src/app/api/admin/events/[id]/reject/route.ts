// src/app/api/admin/events/[id]/reject/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { rejectEventRepo } from "@/features/events/server/repository"
import { getUserRole } from "@/lib/authz"

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
    const role = getUserRole(user)
    if (!role || !['ADMIN', 'REVIEWER'].includes(role)) {
      return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 })
    }

    const { id } = await ctx.params
    const { admin_notes } = await req.json().catch(() => ({}))
    await rejectEventRepo(id, user.id, admin_notes)
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    console.error("Reject error:", err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}
