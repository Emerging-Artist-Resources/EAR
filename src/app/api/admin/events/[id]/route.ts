import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getAdminEventDetail } from "@/features/events/server/service"
import { getUserRole } from "@/lib/authz"

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = getUserRole(user)
    if (!user?.id || (role !== 'ADMIN' && role !== 'REVIEWER')) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
    }

    const data = await getAdminEventDetail(id)
    return NextResponse.json({ data })
  } catch (err) {
    console.error('Admin event GET error:', err)
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}


