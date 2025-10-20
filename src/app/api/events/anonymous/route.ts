// src/app/api/events/anonymous/route.ts
import { NextRequest, NextResponse } from "next/server"
import { z, ZodError } from "zod"
import { createEventAnonymousRepo } from "@/features/events/server/repository"
import { getSupabaseServiceClient } from "@/lib/supabase/service"
// Optional: import { verifyTurnstile } from "@/services/turnstile"

const baseSchema = z.object({
  contact_name: z.string().min(1),
  contact_email: z.string().email(),
  org_name: z.string().optional().nullable(),
  org_website: z.string().url().optional().nullable(),
  address: z.string().optional().nullable(),
  social_handles: z.record(z.string(), z.string()).optional(),
  notes: z.string().optional().nullable(),
  borough: z.string().optional().nullable(),
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (body?.type !== 'performance') {
      return NextResponse.json({ error: { code: 'UNSUPPORTED_TYPE' } }, { status: 400 })
    }
    const input = performancePayloadSchema.parse(body)

    // Optional: captcha
    // const ok = await verifyTurnstile(input.turnstileToken)
    // if (!ok) return NextResponse.json({ error: "Captcha failed" }, { status: 400 })

    const svc = getSupabaseServiceClient()
    const created = await createEventAnonymousRepo(svc, input)
    return NextResponse.json({ data: created }, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT', issues: err.issues } }, { status: 400 })
    }
    console.error("Anonymous create error:", err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}
