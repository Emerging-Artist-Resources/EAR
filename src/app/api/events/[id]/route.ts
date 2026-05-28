// src/app/api/events/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getEventPublicRepo } from "@/features/events/server/repository"
import { z, ZodError } from "zod"
import { flexibleUrlNullableSchema } from "@/lib/validations/flexible-url"
import { updatePendingEventRepo } from "@/features/events/server/repository"
import { getAuthenticatedUser } from "@/lib/auth/helpers"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
  handleApiError,
  validateRequestBody,
} from "@/lib/api/utils"
import { eventPayloadSchema } from "@/features/events/server/event-payload-schema"
import { replaceOwnedListingRepo } from "@/features/events/server/replace-owned-listing"
import type { CreateListingInput } from "@/features/events/server/repository"

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

const listingMetaPatchSchema = z
  .object({
    share: z
      .object({
        recipient_emails: z.array(z.string()).max(10).optional(),
      })
      .strict()
      .optional(),
  })
  .passthrough()

const basePatchSchema = z.object({
  contact_name: z.string().min(1).optional(),
  pronouns: z.string().optional().nullable(),
  contact_email: z.string().email().optional(),
  company: z.string().optional().nullable(),
  company_website: flexibleUrlNullableSchema,
  address: z.string().optional().nullable(),
  place_id: z.string().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  venue_name: z.string().optional().nullable(),
  location_instructions: z.string().optional().nullable(),
  social_handles: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  meta: listingMetaPatchSchema.optional(),
  //borough: z.string().optional().nullable(),
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
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 })
    }
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

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 })
    }

    const { id } = await ctx.params
    const body = await req.json()
    const input = validateRequestBody(body, eventPayloadSchema)
    const supabase = await getSupabaseServerClient()
    const result = await replaceOwnedListingRepo(
      supabase,
      id,
      auth.user.id,
      input as unknown as CreateListingInput
    )
    return createSuccessResponse(result, 200)
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return createErrorResponse(ErrorCodes.VALIDATION_ERROR, "Validation failed", err.issues, 400)
    }
    if (err instanceof Error) {
      if (err.message === "Forbidden") {
        return createErrorResponse(ErrorCodes.FORBIDDEN, err.message, undefined, 403)
      }
      if (err.message === "Listing not found") {
        return createErrorResponse(ErrorCodes.NOT_FOUND, err.message, undefined, 404)
      }
      if (err.message === "Changing listing type is not supported") {
        return createErrorResponse(ErrorCodes.BAD_REQUEST, err.message, undefined, 400)
      }
    }
    return handleApiError(err)
  }
}
