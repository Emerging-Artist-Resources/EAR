// src/app/api/events/anonymous/route.ts
// NOTE: Anonymous submissions are currently disabled, but this route is kept for potential future use
import { NextRequest, NextResponse } from "next/server"
import { z, ZodError } from "zod"
import { createEventAnonymousRepo } from "@/features/events/server/repository"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
// Optional: import { verifyTurnstile } from "@/services/turnstile"

// Transform legacy payload field names to new schema field names
function transformLegacyPayload(input: any): any {
  const transformed = { ...input }
  
  // Transform base fields
  if (transformed.base) {
    if ('org_name' in transformed.base && !transformed.base.company) {
      transformed.base.company = transformed.base.org_name
    }
    if ('org_website' in transformed.base && !transformed.base.company_website) {
      transformed.base.company_website = transformed.base.org_website
    }
  }
  
  // Transform performance details
  if (transformed.type === 'performance' && transformed.details) {
    const details = transformed.details
    if (details.show_name && !details.title) details.title = details.show_name
    if (details.short_description && !details.description) details.description = details.short_description
    if (details.credit_info && !details.description) details.description = details.credit_info
    if (details.ticket_link && !details.link) details.link = details.ticket_link
    if (details.ticket_price_cents && !details.price) {
      details.price = `$${(details.ticket_price_cents / 100).toFixed(2)}`
    }
    if (!details.subtype) details.subtype = 'ORGANIZER' // Default
  }
  
  // Transform audition details
  if (transformed.type === 'audition' && transformed.details) {
    const details = transformed.details
    if (details.audition_name && !details.title) details.title = details.audition_name
    if (details.about_project && !details.description) details.description = details.about_project
    if (details.audition_link && !details.instructions) details.instructions = `Apply at: ${details.audition_link}`
  }
  
  // Transform creative details
  if (transformed.type === 'creative' && transformed.details) {
    const details = transformed.details
    if (details.opportunity_name && !details.title) details.title = details.opportunity_name
    if (details.brief_description && !details.description) details.description = details.brief_description
    if (details.whats_offered && !details.compensation) details.compensation = details.whats_offered
    if (details.stipend_amount && !details.compensation) details.compensation = details.stipend_amount
    if (details.apply_link && !details.link) details.link = details.apply_link
    if (details.deadline && !details.dates) details.dates = details.deadline
    if (!details.host) details.host = 'TBD'
  }
  
  // Transform class details
  if (transformed.type === 'class' && transformed.details) {
    const details = transformed.details
    if (details.class_name && !details.title) details.title = details.class_name
    if (!details.class_workshop_type) details.class_workshop_type = 'CLASS' // Default
    if (!details.organizer) details.organizer = 'TBD'
    if (!details.teachers) details.teachers = 'TBD'
  }
  
  return transformed
}

const baseSchema = z.object({
  contact_name: z.string().min(1),
  pronouns: z.string().optional().nullable(),
  contact_email: z.string().email(),
  company: z.string().optional().nullable(),
  company_website: z.string().url().optional().nullable(),
  address: z.string().optional().nullable(),
  place_id: z.string().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  venue_name: z.string().optional().nullable(),
  location_instructions: z.string().optional().nullable(),
  social_handles: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  borough: z.string().optional().nullable(),
  meta: z.object({
    referral_sources: z.array(z.string()).optional(),
    referral_other: z.string().optional().nullable(),
    join_email_list: z.boolean().optional(),
    submitted_before: z.boolean().optional(),
  }).optional(),
})

const occurrenceSchema = z.object({
  starts_at_utc: z.string().datetime(),
  ends_at_utc: z.string().datetime().optional().nullable(),
  tz: z.string().min(1),
  occurrence_type: z.enum(["event", "deadline"]).optional(),
  address: z.string().optional().nullable(),
  place_id: z.string().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  venue_name: z.string().optional().nullable(),
  location_instructions: z.string().optional().nullable(),
})

const photoSchema = z.object({
  path: z.string().min(1),
  credit: z.string().optional().nullable(),
  sort_order: z.number().int().optional(),
})

const performanceDetailsSchema = z.object({
  subtype: z.enum(["ORGANIZER", "PIECE"]),
  title: z.string().min(1),
  description: z.string().min(1),
  organizer: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  link: z.string().url().optional().nullable(),
  price: z.string().optional().nullable(),
  participants: z.string().optional().nullable(),
  event_type: z.enum(["SOLO", "SPLIT_BILL", "FESTIVAL"]).optional().nullable(),
  agree_comp_tickets: z.boolean().optional(),
  event_dates_confirmed: z.boolean().optional(),
  artist_type: z.enum(["ESTABLISHED", "EMERGING"]).optional().nullable(),
  listing_fee_option: z.enum(["PAY_FEE", "PROVIDE", "EXPLAIN"]).optional().nullable(),
  listing_fee_explanation: z.string().optional().nullable(),
  complementary_ticket_info: z.string().optional().nullable(),
  guest_spot_info: z.string().optional().nullable(),
  // Legacy fields for backward compatibility
  show_name: z.string().optional(),
  short_description: z.string().optional(),
  credit_info: z.string().optional(),
  ticket_price_cents: z.number().int().nonnegative().optional(),
  ticket_link: z.string().optional(),
})

const performancePayloadSchema = z.object({
  type: z.literal("performance"),
  base: baseSchema,
  details: performanceDetailsSchema,
  occurrences: z.array(occurrenceSchema).min(1),
  photos: z.array(photoSchema).optional(),
})

const auditionDetailsSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  eligibility: z.string().min(1),
  compensation: z.string().min(1),
  instructions: z.string().min(1),
  pre_audition_classes: z.string().optional().nullable(),
  fee: z.enum(["PAY_FEE", "PROVIDE", "EXPLAIN"]).optional().nullable(),
  fee_amount: z.string().optional().nullable(),
  artist_type: z.enum(["ESTABLISHED", "EMERGING"]).optional().nullable(),
  // Legacy fields for backward compatibility
  audition_name: z.string().optional(),
  about_project: z.string().optional(),
  audition_link: z.string().optional(),
})

const auditionPayloadSchema = z.object({
  type: z.literal("audition"),
  base: baseSchema,
  details: auditionDetailsSchema,
  occurrences: z.array(occurrenceSchema).min(1),
  photos: z.array(photoSchema).optional(),
})

const creativeDetailsSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  host: z.string().min(1),
  dates: z.string().min(1),
  compensation: z.string().min(1),
  requirements: z.string().min(1),
  link: z.string().min(1),
  fee: z.enum(["PAY_FEE", "PROVIDE", "EXPLAIN"]).optional().nullable(),
  fee_amount: z.string().optional().nullable(),
  artist_type: z.enum(["ESTABLISHED", "EMERGING"]).optional().nullable(),
  // Legacy fields for backward compatibility
  opportunity_name: z.string().optional(),
  brief_description: z.string().optional(),
  whats_offered: z.string().optional(),
  stipend_amount: z.string().optional(),
  deadline: z.string().datetime().optional(),
  apply_link: z.string().optional(),
})

const creativePayloadSchema = z.object({
  type: z.literal("creative"),
  base: baseSchema,
  details: creativeDetailsSchema,
  // Creative opportunities don't always have a concrete event datetime; allow none
  occurrences: z.array(occurrenceSchema).optional(),
  photos: z.array(photoSchema).optional(),
})

const classDetailsSchema = z.object({
  class_workshop_type: z.enum(["CLASS", "WORKSHOP"]),
  title: z.string().min(1),
  description: z.string().min(1),
  organizer: z.string().min(1),
  teachers: z.string().min(1),
  price: z.string().optional().nullable(),
  link: z.string().url().optional().nullable(),
  style_category: z.string().optional().nullable(),
  workshop_details: z.string().optional().nullable(),
  classes_offered: z.string().optional().nullable(),
  drop_in_classes: z.string().optional().nullable(),
  artist_type: z.enum(["ESTABLISHED", "EMERGING"]).optional().nullable(),
  listing_fee_option: z.enum(["PAY_FEE", "PROVIDE", "EXPLAIN"]).optional().nullable(),
  listing_fee_explanation: z.string().optional().nullable(),
  guest_spot_info: z.string().optional().nullable(),
  // Legacy fields for backward compatibility
  festival_name: z.string().optional().nullable(),
  festival_link: z.string().optional().nullable(),
  class_name: z.string().optional(),
  prices: z.any().optional(),
  rrule: z.string().optional().nullable(),
})

const classPayloadSchema = z.object({
  type: z.literal("class"),
  base: baseSchema,
  details: classDetailsSchema,
  occurrences: z.array(occurrenceSchema).min(1),
  photos: z.array(photoSchema).optional(),
})

const fundingDetailsSchema = z.object({
  funding_link: z.string().url().or(z.string().min(1)),
  title: z.string().optional(),
  summary: z.string().optional(),
})

const fundingPayloadSchema = z.object({
  type: z.literal("funding"),
  base: baseSchema,
  details: fundingDetailsSchema,
  occurrences: z.array(occurrenceSchema).optional(),
  photos: z.array(photoSchema).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let input:
      | z.infer<typeof performancePayloadSchema>
      | z.infer<typeof auditionPayloadSchema>
      | z.infer<typeof creativePayloadSchema>
      | z.infer<typeof classPayloadSchema>
      | z.infer<typeof fundingPayloadSchema>

    switch (body?.type) {
      case 'performance':
        input = performancePayloadSchema.parse(body)
        break
      case 'audition':
        input = auditionPayloadSchema.parse(body)
        break
      case 'creative':
        input = creativePayloadSchema.parse(body)
        break
      case 'class':
        input = classPayloadSchema.parse(body)
        break
      case 'funding':
        input = fundingPayloadSchema.parse(body)
        break
      default:
        return NextResponse.json({ error: { code: 'UNSUPPORTED_TYPE' } }, { status: 400 })
    }

    // Optional: captcha
    // const ok = await verifyTurnstile(input.turnstileToken)
    // if (!ok) return NextResponse.json({ error: "Captcha failed" }, { status: 400 })

    const svc = getSupabaseServiceClient()
    // Normalize optional occurrences to empty array for repo
    // Also transform legacy field names to new schema field names
    type AnyPayload = z.infer<typeof performancePayloadSchema> | z.infer<typeof auditionPayloadSchema> | z.infer<typeof creativePayloadSchema> | z.infer<typeof classPayloadSchema> | z.infer<typeof fundingPayloadSchema>
    
    const baseNormalized: AnyPayload & { occurrences: z.infer<typeof occurrenceSchema>[] } = {
      ...(input as AnyPayload),
      occurrences: (input as AnyPayload).occurrences ?? [],
    }
    
    // Transform legacy field names to new schema
    const normalized = transformLegacyPayload(baseNormalized)
    
    const created = await createEventAnonymousRepo(svc, normalized)
    return NextResponse.json({ data: created }, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT', issues: err.issues } }, { status: 400 })
    }
    console.error("Anonymous create error:", err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}
