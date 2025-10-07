import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { notificationSchema } from "@/lib/validations"
import { listAnnouncements, createAnnouncement } from "@/features/announcements/server/service"
import { ZodError } from "zod"
function getUserRole(user: unknown): 'ADMIN' | 'USER' | undefined {
  if (!user || typeof user !== 'object') return undefined
  const u = user as { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }
  const fromApp = u.app_metadata?.role as unknown
  const fromUser = u.user_metadata?.role as unknown
  const val = (fromApp ?? fromUser)
  return val === 'ADMIN' || val === 'USER' ? val : undefined
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const active = searchParams.get("active")

    const data = await listAnnouncements({ active: active === 'true' })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Announcements fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const role = getUserRole(user)
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const validated = notificationSchema.parse(body)

    const insertPayload = {
      title: validated.title,
      content: validated.content,
      type: validated.type,
      author_user_id: user.id,
      // published_at/archived_at managed separately
    }

    const data = await createAnnouncement({
      title: insertPayload.title,
      content: insertPayload.content,
      type: insertPayload.type,
      authorUserId: insertPayload.author_user_id,
    })
    return NextResponse.json(data, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }
    console.error('Announcements create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}