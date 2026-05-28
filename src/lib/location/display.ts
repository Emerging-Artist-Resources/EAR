import { isOnlineVenueName, locationModeFromMeta } from "@/lib/location/mode"

export type LocationDisplaySource = {
  address?: string | null
  venue_name?: string | null
  place_id?: string | null
  location_instructions?: string | null
  meta?: unknown
}

export function isOnlineLocationDisplay(loc: LocationDisplaySource | null | undefined): boolean {
  if (!loc) return false
  if (locationModeFromMeta(loc.meta) === "ONLINE") return true
  return isOnlineVenueName(loc.venue_name)
}

export function listingHasLocationDisplay(loc: LocationDisplaySource | null | undefined): boolean {
  if (!loc) return false
  if (isOnlineLocationDisplay(loc)) return true
  return Boolean((loc.address ?? "").trim() || (loc.venue_name ?? "").trim())
}
