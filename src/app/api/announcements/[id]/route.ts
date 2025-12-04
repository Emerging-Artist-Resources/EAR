import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { getAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/features/announcements/server/service"
// validation handled inside service layer
import { ZodError } from "zod"
import { getUserRole } from '@/lib/authz'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const data = await getAnnouncement(params.id)
    if (!data) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Announcement fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()
    const params = await context.params

    if (!user?.id) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
    const role = getUserRole(user)
    if (role !== 'ADMIN') return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 })

    const body = await request.json()
    const data = await updateAnnouncement(params.id, body)
    return NextResponse.json({ data })
  } catch (error: unknown) {
    if (error instanceof ZodError) return NextResponse.json({ error: { code: 'INVALID_INPUT' } }, { status: 400 })
    console.error('Announcement update error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()
    const params = await context.params

    if (!user?.id) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
    const role = getUserRole(user)
    if (role !== 'ADMIN') return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 })

    await deleteAnnouncement(params.id)
    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    console.error('Announcement delete error:', error)
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}


