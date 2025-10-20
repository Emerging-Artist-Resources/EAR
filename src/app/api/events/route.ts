// src/app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server"
import { z, ZodError } from "zod"
import { createEventOwnedRepo } from "@/features/events/server/repository"

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
  starts_at_utc: z.string().datetime(),     // ISO
  ends_at_utc: z.string().datetime().optional().nullable(),
  tz: z.string().min(1),
})

const photoSchema = z.object({
  path: z.string().min(1),
  credit: z.string().optional().nullable(),
  sort_order: z.number().int().optional(),
})

const payloadSchema = z.object({
  type: z.enum(["performance","audition","creative","class","funding"]),
  base: baseSchema,
  details: z.record(z.string(), z.string()), // validate per type in your feature service if you prefer
  occurrences: z.array(occurrenceSchema).min(1),
  photos: z.array(photoSchema).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = payloadSchema.parse(body)
    const created = await createEventOwnedRepo(input)
    return NextResponse.json(created, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "ZodError") {
      return NextResponse.json({ error: "Invalid form data", issues: (err as unknown as ZodError).issues }, { status: 400 })
    }
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Create owned event error:", err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
