import { NextRequest, NextResponse } from "next/server"
import { performanceSchema } from "@/lib/validations"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { createPerformance, listPerformances } from "@/features/events/server/service"

// src/app/api/performances/route.ts - FIXED VERSION
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
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
    const created = await createPerformance({
      title: validatedData.title,
      date: dateStr,
      showTime: validatedData.showTime,
      createdBy: user?.id ?? null,
      details,
      photoUrls: validatedData.photoUrls ?? [],
    })
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
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("userId")

    const data = await listPerformances({ status, userId })
    return NextResponse.json(data)
  } catch (error) {
    console.error("Performance fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
