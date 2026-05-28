/** Google Maps URL for a place_id or street address. */
export function getGoogleMapsLink(
  address: string | null | undefined,
  placeId: string | null | undefined,
): string | null {
  if (placeId?.trim()) {
    return `https://www.google.com/maps/place/?q=place_id:${placeId.trim()}`
  }
  if (address?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`
  }
  return null
}
