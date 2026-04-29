import { NextRequest, NextResponse } from "next/server"
import { getAdminEventDetail } from "@/features/events/server/service"
import { getAuthenticatedUser, hasRole } from "@/lib/auth-helpers"

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
    }
    if (!hasRole(auth.role, ["ADMIN", "REVIEWER"])) {
      return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 })
    }

    const data = await getAdminEventDetail(id)
    return NextResponse.json({ data })
  } catch (err) {
    console.error('Admin event GET error:', err)
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}


