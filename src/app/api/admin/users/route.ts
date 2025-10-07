import { NextRequest, NextResponse } from "next/server"
import { listUsers, updateUserRole } from "@/features/users/server/service"
import { getUserRole } from "@/lib/authz"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id || getUserRole(user) !== 'ADMIN') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
    }
    const users = await listUsers()
    return NextResponse.json({ data: users })
  } catch (error) {
    console.error("Users fetch error:", error)
    return NextResponse.json(
      { error: { code: 'INTERNAL' } },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id || getUserRole(user) !== 'ADMIN') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
    }

    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT' } }, { status: 400 })
    }

    if (!["USER", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT' } }, { status: 400 })
    }

    const updated = await updateUserRole(userId, role)
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error("User update error:", error)
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}
