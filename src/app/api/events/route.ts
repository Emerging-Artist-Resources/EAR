import { NextRequest } from "next/server"
import { listCalendarItems } from "@/features/events/server/service"
import { z } from "zod"
import { createEventOwnedRepo } from "@/features/events/server/repository"
import { handleApiError, createSuccessResponse, getQueryParam, getQueryParamArray, validateRequestBody } from "@/lib/api-utils"

const eventTypeSchema = z.enum(["performance", "audition", "creative", "class", "funding"])

export async function GET(req: NextRequest) {
  try {
    const from = getQueryParam(req, "from") ?? new Date().toISOString()
    const to = getQueryParam(req, "to") ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
    const typesParam = getQueryParamArray(req, "types")
    const types = typesParam
      .map((t) => {
        const result = eventTypeSchema.safeParse(t)
        return result.success ? result.data : null
      })
      .filter((t): t is "performance" | "audition" | "creative" | "class" | "funding" => t !== null)
    const borough = getQueryParam(req, "borough")

    const data = await listCalendarItems({
      fromISO: from,
      toISO: to,
      types: types.length > 0 ? types : undefined,
      borough: borough ?? null,
    })

    return createSuccessResponse(data, 200)
  } catch (error) {
    return handleApiError(error)
  }
}

const baseSchema = z.object({
  contact_name: z.string().min(1, "Contact name is required"),
  contact_email: z.string().email("Invalid email address"),
  org_name: z.string().optional().nullable(),
  org_website: z.string().url("Invalid URL").optional().nullable(),
  address: z.string().optional().nullable(),
  social_handles: z.record(z.string(), z.string()).optional(),
  notes: z.string().optional().nullable(),
  borough: z.string().optional().nullable(),
})

const occurrenceSchema = z.object({
  starts_at_utc: z.string().datetime("Invalid datetime format"),
  ends_at_utc: z.string().datetime("Invalid datetime format").optional().nullable(),
  tz: z.string().min(1, "Timezone is required"),
})

const photoSchema = z.object({
  path: z.string().min(1, "Photo path is required"),
  credit: z.string().optional().nullable(),
  sort_order: z.number().int().optional(),
})

const payloadSchema = z.object({
  type: z.enum(["performance", "audition", "creative", "class", "funding"]),
  base: baseSchema,
  details: z.record(z.string(), z.unknown()),
  occurrences: z.array(occurrenceSchema).min(1, "At least one occurrence is required"),
  photos: z.array(photoSchema).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = validateRequestBody(body, payloadSchema)
    const created = await createEventOwnedRepo(input)
    return createSuccessResponse(created, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
