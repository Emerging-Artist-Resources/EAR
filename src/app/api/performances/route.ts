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

    // Use date string to avoid timezone issues and match Postgres DATE
    const dateStr = validatedData.date

    const details = {
      submitter_name: validatedData.submitterName,
      submitter_pronouns: validatedData.submitterPronouns,
      contact_email: validatedData.contactEmail,
      company: validatedData.company || null,
      company_website: validatedData.companyWebsite || null,
      ticket_price: validatedData.ticketPrice,
      short_description: validatedData.shortDescription,
      credits: validatedData.credits,
      social_handles: validatedData.socialHandles,
      notes: validatedData.notes || null,
      referral_sources: validatedData.referralSources || [],
      referral_other: validatedData.referralOther || null,
      join_email_list: validatedData.joinEmailList ?? null,
      agree_comp_tickets: validatedData.agreeCompTickets,
    }

    const insertPayload: Record<string, unknown> = {
      event_type: 'PERFORMANCE',
      title: validatedData.title,
      date: dateStr,
      show_time: validatedData.showTime,
      status: 'PENDING',
      created_by: user?.id ?? null,
      details,
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

    // Insert up to 5 photos if provided
    if (validatedData.photoUrls?.length) {
      const photoRows = validatedData.photoUrls.slice(0, 5).map((url, idx) => ({
        event_id: created.id,
        url,
        position: idx,
      }))
      await supabase.from('event_photos').insert(photoRows)
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
