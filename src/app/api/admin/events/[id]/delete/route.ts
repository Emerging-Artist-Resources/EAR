import { NextRequest, NextResponse } from "next/server"
import { deleteListingRepo } from "@/features/events/server/repository"
import { getAuthenticatedUser } from "@/lib/auth/helpers"

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
    if (auth.role !== "ADMIN") {
      return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 })
    }

    const { id } = await ctx.params
    await deleteListingRepo(id)
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    console.error("Delete error:", err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}
