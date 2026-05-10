import { z } from "zod"
import { flexibleUrlNullableSchema } from "@/lib/validations/flexible-url"

const listingMetaSchema = z
  .object({
    share: z
      .object({
        recipient_emails: z.array(z.string()).max(10).optional(),
      })
      .strict()
      .optional(),
  })
  .passthrough()

export const eventPayloadBaseSchema = z.object({
  contact_name: z.string().min(1, "Contact name is required"),
  pronouns: z.string().optional().nullable(),
  contact_email: z.string().email("Invalid email address"),
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
  borough: z.string().optional().nullable(),
  meta: listingMetaSchema.optional(),
})

export const eventOccurrenceSchema = z
  .object({
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
  .superRefine((occ, ctx) => {
    const endRaw = occ.ends_at_utc
    if (endRaw == null || endRaw === "") return
    const startMs = Date.parse(occ.starts_at_utc)
    const endMs = Date.parse(endRaw)
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return
    if (endMs <= startMs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after start time",
        path: ["ends_at_utc"],
      })
    }
  })

export const eventPhotoSchema = z.object({
  path: z.string().min(1, "Photo path is required"),
  credit: z.string().optional().nullable(),
  sort_order: z.number().int().optional(),
})

export const eventPieceDetailsSchema = z.object({
  parent_listing_id: z.string().uuid().optional().nullable(),
  parent_event_name: z.string().optional().nullable(),
  parent_event_website: flexibleUrlNullableSchema,
  parent_event_ticket_link: flexibleUrlNullableSchema,
  parent_event_contact_email: z.string().email("Invalid email address").optional().nullable(),
  piece_schedule_mode: z.enum(["FROM_PARENT", "CUSTOM"]).optional().nullable(),
  selected_slots: z.array(z.string()).optional().nullable(),
  piece_title: z.string().optional().nullable(),
  piece_company: z.string().optional().nullable(),
  piece_company_website: flexibleUrlNullableSchema,
  piece_description: z.string().optional().nullable(),
  choreographer: z.string().optional().nullable(),
})

export const eventPayloadSchema = z.object({
  type: z.enum(["performance", "audition", "creative", "class", "funding"]),
  base: eventPayloadBaseSchema,
  details: z.record(z.string(), z.unknown()),
  occurrences: z.array(eventOccurrenceSchema).min(1, "At least one occurrence is required"),
  photos: z.array(eventPhotoSchema).optional(),
  piece_details: eventPieceDetailsSchema.optional().nullable(),
  parent_listing_id: z.string().uuid().optional().nullable(),
  relationship_type: z.enum(["performance_piece", "workshop_class"]).optional().nullable(),
})

export type EventPayloadInput = z.infer<typeof eventPayloadSchema>
