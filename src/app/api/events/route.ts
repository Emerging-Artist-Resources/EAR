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
  pronouns: z.string().optional().nullable(),
  contact_email: z.string().email("Invalid email address"),
  company: z.string().optional().nullable(),
  company_website: z.string().url("Invalid URL").optional().nullable(),
  address: z.string().optional().nullable(),
  place_id: z.string().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  venue_name: z.string().optional().nullable(),
  location_instructions: z.string().optional().nullable(),
  social_handles: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  borough: z.string().optional().nullable(),
})

const occurrenceSchema = z.object({
  starts_at_utc: z.string().datetime("Invalid datetime format"),
  ends_at_utc: z.string().datetime("Invalid datetime format").optional().nullable(),
  tz: z.string().min(1, "Timezone is required"),
  occurrence_type: z.enum(["event", "deadline"]).optional(),
  address: z.string().optional().nullable(),
  place_id: z.string().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  venue_name: z.string().optional().nullable(),
  location_instructions: z.string().optional().nullable(),
})

const photoSchema = z.object({
  path: z.string().min(1, "Photo path is required"),
  credit: z.string().optional().nullable(),
  sort_order: z.number().int().optional(),
})

const pieceDetailsSchema = z.object({
  parent_listing_id: z.string().uuid().optional().nullable(),
  parent_event_name: z.string().optional().nullable(),
  parent_event_website: z.string().url("Invalid URL").optional().nullable(),
  parent_event_ticket_link: z.string().url("Invalid URL").optional().nullable(),
  parent_event_contact_email: z.string().email("Invalid email address").optional().nullable(),
  piece_schedule_mode: z.enum(["FROM_PARENT", "CUSTOM"]).optional().nullable(),
  selected_slots: z.array(z.string()).optional().nullable(),
})

const payloadSchema = z.object({
  type: z.enum(["performance", "audition", "creative", "class", "funding"]),
  base: baseSchema,
  details: z.record(z.string(), z.unknown()),
  occurrences: z.array(occurrenceSchema).min(1, "At least one occurrence is required"),
  photos: z.array(photoSchema).optional(),
  piece_details: pieceDetailsSchema.optional().nullable(),
  parent_listing_id: z.string().uuid().optional().nullable(),
  relationship_type: z.enum(["performance_piece", "workshop_class"]).optional().nullable(),
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
