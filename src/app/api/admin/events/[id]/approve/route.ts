// src/app/api/admin/events/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server"
import { approveEventRepo } from "@/features/events/server/repository"
import { getAuthenticatedUser, hasRole } from "@/lib/auth-helpers"

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
    if (!hasRole(auth.role, ["ADMIN", "REVIEWER"])) {
      return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 })
    }

    const { id } = await ctx.params
    await approveEventRepo(id, auth.user.id)
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    console.error("Approve error:", err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}
