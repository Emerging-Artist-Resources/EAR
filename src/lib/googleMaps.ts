// src/lib/googleMaps.ts
import { setOptions, importLibrary } from "@googlemaps/js-api-loader"

let placesPromise: Promise<google.maps.PlacesLibrary> | null = null

export function loadPlacesLibrary() {
  if (placesPromise) return placesPromise

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key) {
    return Promise.reject(new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"))
  }

  // IMPORTANT: only once
  setOptions({ key, v: "weekly" })

  placesPromise = importLibrary("places") as Promise<google.maps.PlacesLibrary>
  return placesPromise
}
