import { NextRequest, NextResponse } from "next/server"
import { performanceSchema } from "@/lib/validations"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { ZodError } from "zod"

type EventUpdate = {
  title?: string
  performer?: string
  description?: string | null
  time?: string | null
  location?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  date?: Date
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = getSupabaseServerClient()
    const { data: performance, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Supabase fetch error:', error)
      return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
    }

    if (!performance) {
      return NextResponse.json({ error: "Performance not found" }, { status: 404 })
    }

    return NextResponse.json(performance)
  } catch (error) {
    console.error("Performance fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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

    if (!user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    // Allow partial update: validate known fields only
    const partial = performanceSchema.partial().parse(body)

    const updatePayload: EventUpdate = {}
    if (partial.title !== undefined) updatePayload.title = partial.title
    if (partial.performer !== undefined) updatePayload.performer = partial.performer
    if (partial.description !== undefined) updatePayload.description = partial.description
    if (partial.time !== undefined) updatePayload.time = partial.time
    if (partial.location !== undefined) updatePayload.location = partial.location
    if (partial.contactEmail !== undefined) updatePayload.contact_email = partial.contactEmail
    if (partial.contactPhone !== undefined) updatePayload.contact_phone = partial.contactPhone
    if (partial.date !== undefined) updatePayload.date = new Date(partial.date + "T00:00:00")
  
    const { data, error } = await supabase
      .from('events')
      .update(updatePayload)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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

    if (!user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
    }

    return NextResponse.json({ message: "Performance deleted" })
  } catch (error) {
    console.error("Performance delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


