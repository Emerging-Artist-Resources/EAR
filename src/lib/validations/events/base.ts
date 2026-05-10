import { z } from "zod"
import { flexibleUrlOrEmptySchema } from "../flexible-url"

/**
 * Map/autocomplete and HTML inputs often yield lat/lng as strings; coerce to number for API + DB.
 */
export const optionalLatLng = z.preprocess((val: unknown) => {
  if (val === "" || val === null || val === undefined) return undefined
  if (typeof val === "number") return Number.isFinite(val) ? val : undefined
  const n = Number(String(val).trim())
  return Number.isFinite(n) ? n : undefined
}, z.number().optional())

// Shared base across all forms
// Note: User info (name, pronouns, email) is retrieved from authenticated user profile, not form data
export const baseSchema = z.object({
  // Company/Organization fields (optional)
  // These fields are stored in the listings table but are not currently collected in the form UI
  // They may be populated from user profile data or left as null
  // Schema alignment: matches listings.company and listings.company_website columns
  company: z.string().optional(),
  companyWebsite: flexibleUrlOrEmptySchema,
  address: z.string().optional(),
  placeId: z.string().optional(),
  lat: optionalLatLng,
  lng: optionalLatLng,
  venueName: z.string().optional(),
  locationInstructions: z.string().optional(),
  socialHandles: z.string().optional(),
  notes: z.string().optional(),
  promoImagePaths: z.array(z.string()).max(5).optional(),
  credits: z.string().optional(),
})

/**
 * Canonical schedule shape:
 * occurrences = [{ date, times: [{ time, endTime? }], address?, venueName?, placeId?, lat?, lng?, locationInstructions? }]
 *
 * Location fields are optional and used when locationConfig is provided in DateTimeList
 * (e.g., for performance and class/workshop where each occurrence can have its own location)
 */

/** Same calendar-day HH:mm rules as occurrenceTimeSchema — reusable for step-level superRefine (e.g. class) where times are loosely typed. */
export function refineOccurrenceTimeSlotEndAfterStart(
  slot: { time?: string | null | undefined; endTime?: string | null | undefined },
  ctx: z.RefinementCtx,
  pathPrefix: (string | number)[],
): void {
  const raw = (slot.endTime ?? "").trim()
  if (!raw) return
  const endPath = [...pathPrefix, "endTime"]
  if (!/^\d{2}:\d{2}$/.test(raw)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a valid end time",
      path: endPath,
    })
    return
  }
  const start = String(slot.time ?? "").trim()
  if (!/^\d{2}:\d{2}$/.test(start)) return
  const toMin = (s: string) => {
    const [h, m] = s.split(":").map(Number)
    return h * 60 + m
  }
  if (toMin(raw) <= toMin(start)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End time must be after start time",
      path: endPath,
    })
  }
}

export const occurrenceTimeSchema = z
  .object({
    time: z.string().min(1, "Time is required"),
    endTime: z.union([z.literal(""), z.string()]).optional(),
  })
  .superRefine((row, ctx) => {
    refineOccurrenceTimeSlotEndAfterStart(row, ctx, [])
  })

/**
 * Wizard / merge schemas use optional `time` while editing; must still allow `endTime`
 * so Zod parse does not strip it before `buildEventPayload` → `ends_at_utc`.
 */
export const lenientOccurrenceTimeSlotSchema = z.object({
  time: z.string().optional(),
  endTime: z.union([z.literal(""), z.string()]).optional(),
})

export const occurrenceSchema = z.object({
  date: z.string().min(1, "Date is required"),
  times: z.array(occurrenceTimeSchema).min(1, "At least one time is required"),
  // Optional location fields (used when locationConfig is provided in DateTimeList)
  // These allow each occurrence to have its own location (for performance/class)
  address: z.string().optional(),
  venueName: z.string().optional(),
  placeId: z.string().optional(),
  lat: optionalLatLng,
  lng: optionalLatLng,
  locationInstructions: z.string().optional(),
})

export const occurrencesSchema = z.array(occurrenceSchema).min(1, "Add at least one date & time")

/**
 * Backwards-compat helpers (your existing extras)
 * (Same shape as canonical; keep these exports to avoid breaking imports)
 */
export const extraTimeSchema = occurrenceTimeSchema
export const extraDateSchema = occurrenceSchema
