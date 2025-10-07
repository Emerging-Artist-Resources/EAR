import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

function getUserRole(user: unknown): 'ADMIN' | 'USER' | undefined {
  if (!user || typeof user !== 'object') return undefined
  const u = user as { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }
  const fromApp = u.app_metadata?.role as unknown
  const fromUser = u.user_metadata?.role as unknown
  const val = (fromApp ?? fromUser)
  return val === 'ADMIN' || val === 'USER' ? val : undefined
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id || getUserRole(user) !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // List users from profiles table (avoid service-role reads of auth.users)
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, name, role, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase profiles fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Shape response similar to previous
    type ProfileRow = { user_id: string; name: string | null; role: string | null; created_at: string }
    const rows = (data as unknown as ProfileRow[]) || []
    const users = rows.map((p) => ({
      id: p.user_id,
      name: p.name,
      email: null as string | null,
      role: p.role ?? 'USER',
      createdAt: p.created_at,
      _count: { performances: 0, reviews: 0 },
    }))

    return NextResponse.json(users)
  } catch (error) {
    console.error("Users fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id || getUserRole(user) !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!["USER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      )
    }

    // Update profile role
    const { error: upsertErr } = await supabase
      .from('profiles')
      .upsert({ user_id: userId, role }, { onConflict: 'user_id' })
    if (upsertErr) {
      console.error('Supabase profiles upsert error:', upsertErr)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // Update auth.users app_metadata.role via service role
    const url = process.env.SUPABASE_URL as string
    const service = process.env.SERVICE_ROLE_KEY as string
    if (!url || !service) {
      return NextResponse.json({ error: 'Server auth not configured' }, { status: 500 })
    }
    const sr = createClient(url, service)
    const { error: adminErr } = await sr.auth.admin.updateUserById(userId, {
      app_metadata: { role }
    })
    if (adminErr) {
      console.error('Supabase admin update error:', adminErr)
      return NextResponse.json({ error: 'Failed to apply auth role' }, { status: 500 })
    }

    return NextResponse.json({ id: userId, role })
  } catch (error) {
    console.error("User update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
