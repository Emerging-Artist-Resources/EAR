// src/app/api/events/anonymous/route.ts
import { NextRequest, NextResponse } from "next/server"
import { z, ZodError } from "zod"
import { createEventAnonymousRepo } from "@/features/events/server/repository"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
// Optional: import { verifyTurnstile } from "@/services/turnstile"

const baseSchema = z.object({
  contact_name: z.string().min(1),
  pronouns: z.string().optional().nullable(),
  contact_email: z.string().email(),
  org_name: z.string().optional().nullable(),
  org_website: z.string().url().optional().nullable(),
  address: z.string().optional().nullable(),
  social_handles: z.record(z.string(), z.string()).optional(),
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
})

const photoSchema = z.object({
  path: z.string().min(1),
  credit: z.string().optional().nullable(),
  sort_order: z.number().int().optional(),
})

const performanceDetailsSchema = z.object({
  show_name: z.string().min(1),
  short_description: z.string().min(1),
  credit_info: z.string().min(1),
  ticket_price_cents: z.number().int().nonnegative(),
  ticket_link: z.string().min(1),
  agree_comp_tickets: z.boolean(),
})

const performancePayloadSchema = z.object({
  type: z.literal("performance"),
  base: baseSchema,
  details: performanceDetailsSchema,
  occurrences: z.array(occurrenceSchema).min(1),
  photos: z.array(photoSchema).optional(),
})

const auditionDetailsSchema = z.object({
  audition_name: z.string().min(1),
  about_project: z.string().min(1),
  eligibility: z.string().min(1),
  compensation: z.string().min(1),
  audition_link: z.string().min(1),
})

const auditionPayloadSchema = z.object({
  type: z.literal("audition"),
  base: baseSchema,
  details: auditionDetailsSchema,
  occurrences: z.array(occurrenceSchema).min(1),
  photos: z.array(photoSchema).optional(),
})

const creativeDetailsSchema = z.object({
  opportunity_name: z.string().min(1),
  brief_description: z.string().min(1),
  eligibility: z.string().min(1),
  whats_offered: z.string().min(1),
  stipend_amount: z.string().min(1),
  requirements: z.string().min(1),
  deadline: z.string().datetime(),
  apply_link: z.string().min(1),
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
  festival_name: z.string().optional().nullable(),
  festival_link: z.string().optional().nullable(),
  class_name: z.string().min(1),
  description: z.string().min(1),
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
    type AnyPayload = z.infer<typeof performancePayloadSchema> | z.infer<typeof auditionPayloadSchema> | z.infer<typeof creativePayloadSchema> | z.infer<typeof classPayloadSchema> | z.infer<typeof fundingPayloadSchema>
    const normalized: AnyPayload & { occurrences: z.infer<typeof occurrenceSchema>[] } = {
      ...(input as AnyPayload),
      occurrences: (input as AnyPayload).occurrences ?? [],
    }
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
