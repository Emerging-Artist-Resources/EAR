import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { notificationSchema } from "@/lib/validations"
import { ZodError } from "zod"
function getUserRole(user: unknown): 'ADMIN' | 'USER' | undefined {
  if (!user || typeof user !== 'object') return undefined
  const u = user as { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }
  const fromApp = u.app_metadata?.role as unknown
  const fromUser = u.user_metadata?.role as unknown
  const val = (fromApp ?? fromUser)
  return val === 'ADMIN' || val === 'USER' ? val : undefined
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', params.id)
      .single()
    if (error) {
      console.error('Supabase announcement fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch announcement' }, { status: 500 })
    }
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
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
    const supabase = getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const params = await context.params

    if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    const role = getUserRole(user)
    if (role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const body = await request.json()
    const partial = notificationSchema.partial().parse(body)

    const updatePayload: Record<string, unknown> = {}
    if (partial.title !== undefined) updatePayload.title = partial.title
    if (partial.content !== undefined) updatePayload.content = partial.content
    if (partial.type !== undefined) updatePayload.type = partial.type
    if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
      const isActive = Boolean(body.isActive)
      updatePayload.archived_at = isActive ? null : new Date()
      if (isActive && !('published_at' in updatePayload)) updatePayload.published_at = new Date()
    }

    const { data, error } = await supabase
      .from('announcements')
      .update(updatePayload)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Supabase announcement update error:', error)
      return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (error: unknown) {
    if (error instanceof ZodError) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    console.error('Announcement update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const params = await context.params

    if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    const role = getUserRole(user)
    if (role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Supabase announcement delete error:', error)
      return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
    }
    return NextResponse.json({ message: 'Announcement deleted' })
  } catch (error) {
    console.error('Announcement delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


