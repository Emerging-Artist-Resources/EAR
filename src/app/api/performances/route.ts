import { NextRequest, NextResponse } from "next/server"
import { performanceSchema } from "@/lib/validations"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// src/app/api/performances/route.ts - FIXED VERSION
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const body = await request.json()
    const validatedData = performanceSchema.parse(body)

    // Fix timezone issue
    const dateStr = validatedData.date
    const localDate = new Date(dateStr + 'T00:00:00')
    
    // Insert into Supabase 'events' (provisional columns until schema refactor)
    const insertPayload = {
      title: validatedData.title,
      performer: validatedData.performer,
      description: validatedData.description ?? null,
      time: validatedData.time ?? null,
      location: validatedData.location ?? null,
      contact_email: validatedData.contactEmail ?? null,
      contact_phone: validatedData.contactPhone ?? null,
      date: localDate,
      status: 'PENDING',
      created_by: user?.id ?? null,
    }

    const { data: created, error } = await supabase
      .from('events')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    }

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Performance creation error:", error)
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid form data" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("userId")

    let query = supabase
      .from('events')
      .select('*')

    if (status) query = query.eq('status', status)
    if (userId) query = query.eq('created_by', userId)

    query = query.order('date', { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error('Supabase fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Performance fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
