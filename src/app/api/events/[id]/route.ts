// src/app/api/events/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getEventPublicRepo } from "@/features/events/server/repository"
import { z, ZodError } from "zod"
import { updatePendingEventRepo } from "@/features/events/server/repository"

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const data = await getEventPublicRepo(id)
    if (!data) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
    return NextResponse.json({ data }, { headers: { "Cache-Control": "s-maxage=60" } })
  } catch (err) {
    console.error("Event public GET error:", err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 })
  }
}

const basePatchSchema = z.object({
  contact_name: z.string().min(1).optional(),
  contact_email: z.string().email().optional(),
  org_name: z.string().optional().nullable(),
  org_website: z.string().url().optional().nullable(),
  address: z.string().optional().nullable(),
  social_handles: z.record(z.string(), z.string()).optional(),
  notes: z.string().optional().nullable(),
  borough: z.string().optional().nullable(),
})

const detailsPatchSchema = z.record(z.string(), z.string()) // validate in feature service if desired

const patchSchema = z.object({
  base: basePatchSchema.optional(),
  details: detailsPatchSchema.optional(),
})

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const body = await req.json()
    const patch = patchSchema.parse(body)
    await updatePendingEventRepo(id, patch)
    return NextResponse.json({ data: { ok: true } })
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: { code: 'INVALID_INPUT', issues: err.issues } }, { status: 400 })
    }
    // RLS will 403 if not owner or not pending
    console.error("Update pending event error:", err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 })
  }
}
