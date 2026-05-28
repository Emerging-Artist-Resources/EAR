// src/app/api/admin/events/[id]/reject/route.ts
import { NextRequest, NextResponse } from "next/server"
import { rejectEventRepo } from "@/features/events/server/repository"
import { getAuthenticatedUser, hasRole } from "@/lib/auth/helpers"

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
    if (!hasRole(auth.role, ["ADMIN", "REVIEWER"])) {
      return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 })
    }

    const { id } = await ctx.params
    const { admin_notes } = await req.json().catch(() => ({}))
    await rejectEventRepo(id, auth.user.id, admin_notes)
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    console.error("Reject error:", err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}
