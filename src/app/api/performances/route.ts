import { NextRequest, NextResponse } from "next/server"
import { performanceSchema } from "@/lib/validations/events"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createPerformance, listPerformances } from "@/features/events/server/service"
import { z, ZodError } from "zod"
import { rateLimitService } from "@/services/rate-limit"
import { captchaService } from "@/services/captcha"

// src/app/api/performances/route.ts - FIXED VERSION
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    const body = await request.json()
    const validatedData = performanceSchema.parse(body)

    // Basic rate limit for anonymous submissions
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rl = await rateLimitService.check(`perf:${ip}`, 10, 60) // 10 requests/min
    if (!rl.allowed) {
      return NextResponse.json({ error: { code: 'RATE_LIMITED' } }, { status: 429 })
    }

    // Optional Turnstile verification (pass token in header or body)
    const turnstileToken = (request.headers.get('cf-turnstile-token') || (body?.turnstileToken as string | undefined))
    const captcha = await captchaService.verifyTurnstile(turnstileToken)
    if (!captcha.success) {
      return NextResponse.json({ error: { code: 'CAPTCHA_FAILED' } }, { status: 400 })
    }

    const created = await createPerformance(validatedData, user?.id ?? null)
    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT', issues: error.issues } }, { status: 400 })
    }
    console.error("Performance creation error:", error)
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const listQuery = z.object({
      status: z.enum(['PENDING','APPROVED','REJECTED']).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      cursor: z.string().optional(),
      scope: z.enum(['public','mine']).default('public'),
    })
    const q = listQuery.parse(Object.fromEntries(new URL(request.url).searchParams))

    let userId: string | null = null
    if (q.scope === 'mine') {
      const supabase = createRouteHandlerClient({ cookies })
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id ?? null
    }

    const result = await listPerformances({
      status: q.status,
      limit: q.limit,
      cursor: q.cursor ?? null,
      userId,
    })
    return NextResponse.json({ data: result.items, nextCursor: result.nextCursor }, { headers: { 'Cache-Control': 's-maxage=60' } })
  } catch (error) {
    console.error("Performance fetch error:", error)
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}
