import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/authz"
import { listAdminEvents } from "@/features/events/server/service"

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = getUserRole(user)
    if (!user?.id || (role !== 'ADMIN' && role !== 'REVIEWER')) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
    }

    const url = new URL(req.url)
    const status = (url.searchParams.get('status') || 'pending').toLowerCase()
    const limit = Math.min(Number(url.searchParams.get('limit') || '50'), 100)

    // Pull events in the requested status with minimal detail fields
    const items = await listAdminEvents(status as 'pending'|'approved'|'rejected', limit)
    return NextResponse.json({ data: items })
  } catch (err) {
    console.error('Admin events GET error:', err)
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}