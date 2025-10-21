// import { NextRequest, NextResponse } from "next/server"
// import { performanceSchema } from "@/lib/validations/events"
// import { cookies } from "next/headers"
// import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
// import { ZodError } from "zod"

// type EventUpdate = {
//   title?: string
//   show_time?: string | null
//   date?: string
//   details?: Record<string, unknown>
// }

// export async function GET(
//   request: NextRequest,
//   context: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const params = await context.params
//     const supabase = createRouteHandlerClient({ cookies })
//     const { data: performance, error } = await supabase
//       .from('events')
//       .select('*')
//       .eq('id', params.id)
//       .single()

//     if (error) {
//       console.error('Supabase fetch error:', error)
//       return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
//     }

//     if (!performance) {
//       return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
//     }

//     return NextResponse.json({ data: performance })
//   } catch (error) {
//     console.error("Performance fetch error:", error)
//     return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
//   }
// }

// export async function PATCH(
//   request: NextRequest,
//   context: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const supabase = createRouteHandlerClient({ cookies })
//     const { data: { user } } = await supabase.auth.getUser()
//     const params = await context.params

//     if (!user?.id) {
//       return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
//     }

//     const body = await request.json()
//     // Allow partial update: validate known fields only
//     const partial = performanceSchema.partial().parse(body)

//     // Fetch current to merge details
//     const { data: existing, error: fetchErr } = await supabase
//       .from('events')
//       .select('details')
//       .eq('id', params.id)
//       .single()
//     if (fetchErr) {
//       console.error('Supabase fetch existing error:', fetchErr)
//       return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
//     }

//     const updatePayload: EventUpdate = {}
//     if (partial.title !== undefined) updatePayload.title = partial.title
//     const pAny = partial as unknown as { showTime?: string }
//     if (pAny.showTime !== undefined) updatePayload.show_time = pAny.showTime
//     if (partial.date !== undefined) updatePayload.date = partial.date

//     const detailUpdates: Record<string, unknown> = {}
//     if (partial.submitterName !== undefined) detailUpdates.submitter_name = partial.submitterName
//     if (partial.submitterPronouns !== undefined) detailUpdates.submitter_pronouns = partial.submitterPronouns
//     if (partial.contactEmail !== undefined) detailUpdates.contact_email = partial.contactEmail
//     if (partial.company !== undefined) detailUpdates.company = partial.company
//     if (partial.companyWebsite !== undefined) detailUpdates.company_website = partial.companyWebsite
//     if (partial.ticketPrice !== undefined) detailUpdates.ticket_price = partial.ticketPrice
//     if (partial.shortDescription !== undefined) detailUpdates.short_description = partial.shortDescription
//     if (partial.credits !== undefined) detailUpdates.credits = partial.credits
//     if (partial.socialHandles !== undefined) detailUpdates.social_handles = partial.socialHandles
//     if (partial.notes !== undefined) detailUpdates.notes = partial.notes
//     if (partial.referralSources !== undefined) detailUpdates.referral_sources = partial.referralSources
//     if (partial.referralOther !== undefined) detailUpdates.referral_other = partial.referralOther
//     if (partial.joinEmailList !== undefined) detailUpdates.join_email_list = partial.joinEmailList
//     if (partial.agreeCompTickets !== undefined) detailUpdates.agree_comp_tickets = partial.agreeCompTickets

//     if (Object.keys(detailUpdates).length > 0) {
//       updatePayload.details = { ...(existing?.details ?? {}), ...detailUpdates }
//     }
  
//     const { data, error } = await supabase
//       .from('events')
//       .update(updatePayload)
//       .eq('id', params.id)
//       .select()
//       .single()

//     if (error) {
//       console.error('Supabase update error:', error)
//       return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
//     }

//     return NextResponse.json({ data })
//   } catch (error: unknown) {
//     if (error instanceof ZodError) {
//       return NextResponse.json({ error: { code: 'INVALID_INPUT' } }, { status: 400 })
//     }
//     return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
//   }
// }

// export async function DELETE(
//   request: NextRequest,
//   context: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const supabase = createRouteHandlerClient({ cookies })
//     const { data: { user } } = await supabase.auth.getUser()
//     const params = await context.params

//     if (!user?.id) {
//       return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
//     }

//     const { error } = await supabase
//       .from('events')
//       .delete()
//       .eq('id', params.id)

//     if (error) {
//       console.error('Supabase delete error:', error)
//       return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
//     }

//     return NextResponse.json({ data: { deleted: true } })
//   } catch (error) {
//     console.error("Performance delete error:", error)
//     return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
//   }
// }