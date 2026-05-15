/**
 * Shared location mode for listing forms: in-person (Google Places) vs online.
 * Online rows persist as venue_name "Online" with join details in location_instructions.
 */

import { z } from "zod"

export const LOCATION_MODE_IN_PERSON = "IN_PERSON" as const
export const LOCATION_MODE_ONLINE = "ONLINE" as const

export type LocationMode = typeof LOCATION_MODE_IN_PERSON | typeof LOCATION_MODE_ONLINE

export const ONLINE_VENUE_LABEL = "Online"

export const LOCATION_MODE_OPTIONS: { value: LocationMode; label: string }[] = [
  { value: LOCATION_MODE_IN_PERSON, label: "In person" },
  { value: LOCATION_MODE_ONLINE, label: "Online" },
]

export const DEFAULT_LOCATION_MODE: LocationMode = LOCATION_MODE_IN_PERSON

export function isLocationMode(value: unknown): value is LocationMode {
  return value === LOCATION_MODE_IN_PERSON || value === LOCATION_MODE_ONLINE
}

export function normalizeLocationMode(value: unknown): LocationMode {
  return isLocationMode(value) ? value : DEFAULT_LOCATION_MODE
}

/** Coerce Places displayName objects and other values to a plain string. */
export function coerceLocationFieldString(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "string") return value
  if (typeof value === "object" && value !== null && "text" in value) {
    const text = (value as { text?: unknown }).text
    if (typeof text === "string") return text
  }
  return String(value)
}

/** Accepts null/empty/invalid values as undefined so RHF defaults do not fail enum parsing. */
export const optionalLocationModeSchema = z.preprocess((val: unknown) => {
  if (val == null || val === "") return undefined
  return isLocationMode(val) ? val : undefined
}, z.enum([LOCATION_MODE_IN_PERSON, LOCATION_MODE_ONLINE]).optional())

/** Coerces Places displayName objects (and null) before optional string validation. */
export const optionalCoercedStringSchema = z.preprocess((val: unknown) => {
  if (val == null || val === "") return undefined
  const s = coerceLocationFieldString(val).trim()
  return s || undefined
}, z.string().optional())

export function isOnlineVenueName(venueName: unknown): boolean {
  return coerceLocationFieldString(venueName).trim() === ONLINE_VENUE_LABEL
}

export function isOnlineLocationMode(mode: unknown): boolean {
  return normalizeLocationMode(mode) === LOCATION_MODE_ONLINE
}

export function locationModeFromMeta(meta: unknown): LocationMode | undefined {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return undefined
  const raw = (meta as Record<string, unknown>).location_mode
  return isLocationMode(raw) ? raw : undefined
}

export function inferLocationModeFromStored(params: {
  venueName?: string | null
  meta?: unknown
}): LocationMode {
  const fromMeta = locationModeFromMeta(params.meta)
  if (fromMeta) return fromMeta
  if (isOnlineVenueName(params.venueName)) return LOCATION_MODE_ONLINE
  return DEFAULT_LOCATION_MODE
}

export type LocationFormFields = {
  locationMode?: LocationMode | string | null
  address?: string | null
  placeId?: string | null
  lat?: number | null
  lng?: number | null
  venueName?: string | null
  locationInstructions?: string | null
}

export type PersistedLocationFields = {
  address: string | null
  place_id: string | null
  lat: number | null
  lng: number | null
  venue_name: string | null
  location_instructions: string | null
}

/** Form → API/DB location columns. */
export function normalizeLocationFieldsForPersist(
  fields: LocationFormFields,
): PersistedLocationFields {
  const mode = normalizeLocationMode(fields.locationMode)
  const instructions = (fields.locationInstructions ?? "").trim() || null

  if (mode === LOCATION_MODE_ONLINE) {
    return {
      address: null,
      place_id: null,
      lat: null,
      lng: null,
      venue_name: ONLINE_VENUE_LABEL,
      location_instructions: instructions,
    }
  }

  const address = coerceLocationFieldString(fields.address).trim() || null
  const venueName = coerceLocationFieldString(fields.venueName).trim() || null
  const placeId = coerceLocationFieldString(fields.placeId).trim() || null
  const lat =
    typeof fields.lat === "number" && Number.isFinite(fields.lat) ? fields.lat : null
  const lng =
    typeof fields.lng === "number" && Number.isFinite(fields.lng) ? fields.lng : null

  return {
    address,
    place_id: placeId,
    lat,
    lng,
    venue_name: isOnlineVenueName(venueName) ? null : venueName,
    location_instructions: instructions,
  }
}

/** Whether the user has provided a complete location (in-person or online). */
export function hasCompleteLocation(fields: LocationFormFields | undefined): boolean {
  if (!fields) return false
  if (isOnlineLocationMode(fields.locationMode) || isOnlineVenueName(fields.venueName)) {
    return Boolean(coerceLocationFieldString(fields.locationInstructions).trim())
  }
  const address = coerceLocationFieldString(fields.address).trim()
  const venueName = coerceLocationFieldString(fields.venueName).trim()
  const placeId = coerceLocationFieldString(fields.placeId).trim()
  return address !== "" || venueName !== "" || placeId !== ""
}

export function mergeLocationModeIntoMeta(
  meta: Record<string, unknown> | null | undefined,
  locationMode: LocationMode,
): Record<string, unknown> {
  const out = { ...(meta ?? {}) }
  if (locationMode === LOCATION_MODE_ONLINE) {
    out.location_mode = LOCATION_MODE_ONLINE
  } else {
    delete out.location_mode
  }
  return out
}

/** Clears in-person geo fields when switching to online (and vice versa). */
/** Zod / step validation: path + message when location is incomplete. */
export function locationValidationIssue(
  fields: LocationFormFields | undefined,
  pathPrefix: (string | number)[],
  messages?: { inPerson?: string; online?: string },
): { path: (string | number)[]; message: string } | null {
  if (hasCompleteLocation(fields)) return null
  const online =
    isOnlineLocationMode(fields?.locationMode) || isOnlineVenueName(fields?.venueName)
  return {
    path: [...pathPrefix, online ? "locationInstructions" : "address"],
    message: online
      ? (messages?.online ?? "Please add how to attend online")
      : (messages?.inPerson ?? "Location is required"),
  }
}

export function clearedInPersonLocationFields(): Pick<
  LocationFormFields,
  "address" | "placeId" | "lat" | "lng" | "venueName"
> {
  return {
    address: "",
    placeId: "",
    lat: undefined,
    lng: undefined,
    venueName: "",
  }
}
