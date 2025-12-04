import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { notificationSchema } from "@/lib/validations"
import { listAnnouncements, createAnnouncement } from "@/features/announcements/server/service"
import { ZodError } from "zod"
import { getUserRole } from "@/lib/authz"

export async function GET() {
  try {
    const data = await listAnnouncements()
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Announcements fetch error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
    }
    const role = getUserRole(user)
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 })
    }

    const body = await request.json()
    const validated = notificationSchema.parse(body)
    const data = await createAnnouncement({
      title: validated.title,
      content: validated.content,
      type: validated.type,
      authorUserId: user.id,
    })
    return NextResponse.json({ data }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT' } }, { status: 400 })
    }
    console.error('Announcements create error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}