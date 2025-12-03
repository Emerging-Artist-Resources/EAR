// src/app/api/admin/events/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { approveEventRepo } from "@/features/events/server/repository"
import { getUserRole } from "@/lib/authz"

export async function POST(
  _req: NextRequest,
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
    await approveEventRepo(id, user.id)
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    console.error("Approve error:", err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}
