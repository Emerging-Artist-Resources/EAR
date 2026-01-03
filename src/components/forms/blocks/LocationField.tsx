"use client"

import { useEffect, useRef, useState } from "react"
import { UseFormReturn, Path } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { loadPlacesLibrary } from "../../../lib/googleMaps"

interface LocationFieldProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  addressName: string
  venueName?: string
  placeIdName?: string
  latName?: string
  lngName?: string
  instructionsName?: string
  label?: string
  note?: string
  instructionsLabel?: string
  instructionsPlaceholder?: string
  required?: boolean
  showAsterisk?: boolean
  errorMode?: "touched" | "always"
}

export function LocationField<T extends Record<string, unknown>>({
  form,
  addressName,
  venueName,
  placeIdName,
  latName,
  lngName,
  instructionsName,
  label = "Location",
  note,
  instructionsLabel = "Location Instructions",
  instructionsPlaceholder = "Details to help attendees find the location",
  required,
  showAsterisk = true,
  errorMode = "touched",
}: LocationFieldProps<T>) {
  const { register, setValue } = form

  const containerRef = useRef<HTMLDivElement | null>(null)
  const elementRef = useRef<HTMLElement | null>(null)

  const [apiError, setApiError] = useState<string | null>(null)

  const addrState = form.getFieldState(addressName as unknown as never)
  const instrState = instructionsName
    ? form.getFieldState(instructionsName as unknown as never)
    : undefined

  const showAddrError =
    Boolean(addrState.error) &&
    (errorMode === "always" ||
      addrState.isTouched ||
      form.formState.isSubmitted ||
      form.formState.submitCount > 0)

  const showInstrError =
    Boolean(instrState?.error) &&
    (errorMode === "always" ||
      instrState?.isTouched ||
      form.formState.isSubmitted ||
      form.formState.submitCount > 0)

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const placesLib = await loadPlacesLibrary()
        if (cancelled) return
        if (!containerRef.current) return
        if (elementRef.current) return

        // Create Google’s new recommended autocomplete element
        // Some versions expose it on placesLib, others on google.maps.places.*
        const PlaceAutocompleteElement =
          (placesLib as unknown as { PlaceAutocompleteElement: typeof google.maps.places.PlaceAutocompleteElement }).PlaceAutocompleteElement ||
          (google.maps.places as unknown as { PlaceAutocompleteElement: typeof google.maps.places.PlaceAutocompleteElement }).PlaceAutocompleteElement

        if (!PlaceAutocompleteElement) {
          setApiError("PlaceAutocompleteElement not available. Check Maps JS API + Places enabled.")
          return
        }

        const el = new PlaceAutocompleteElement({
          // optional: request the fields you care about
          // (Google may still require fetchFields for some details)
        })

        // Optional: hint text
        el.setAttribute("placeholder", "Start typing an address…")
        el.style.width = "100%"

        containerRef.current.innerHTML = ""
        containerRef.current.appendChild(el)
        elementRef.current = el

        // Event when user picks a suggestion
        const handler = async (evt: any) => {
          try {
            const place = evt?.detail?.place
            if (!place) return

            // Ensure fields are present (fetchFields is the “new” way)
            if (place.fetchFields) {
              await place.fetchFields({
                fields: ["formattedAddress", "displayName", "id", "location"],
              })
            }

            const formatted =
              place.formattedAddress ||
              place.formatted_address ||
              ""

            const displayName =
              place.displayName ||
              place.name ||
              ""

            const id =
              place.id ||
              place.place_id ||
              ""

            setValue(addressName as Path<T>, formatted as unknown as never, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })

            if (venueName) {
              setValue(venueName as Path<T>, displayName as never, { shouldDirty: true })
            }
            if (placeIdName) {
              setValue(placeIdName as Path<T>, id as never, { shouldDirty: true })
            }

            const loc = place.location || place.geometry?.location
            if (loc) {
              const lat = typeof loc.lat === "function" ? loc.lat() : loc.lat
              const lng = typeof loc.lng === "function" ? loc.lng() : loc.lng

              if (latName) setValue(latName as Path<T>, String(lat) as never, { shouldDirty: true })
              if (lngName) setValue(lngName as Path<T>, String(lng) as never, { shouldDirty: true })
            }
          } catch (e) {
            console.error(e)
          }
        }

        el.addEventListener("gmp-placeselect", handler)

        // cleanup function returned for event listener removal
        return () => {
          el.removeEventListener("gmp-placeselect", handler)
        }
      } catch (e: unknown) {
        console.error(e)
        setApiError(
          "Google Places failed to load. Most common: API restrictions blocking Maps JavaScript API."
        )
        return undefined
      }
    }

    const cleanupPromise = init()

    return () => {
      cancelled = true
      // Remove element on unmount to avoid duplicates
      if (elementRef.current && containerRef.current) {
        containerRef.current.innerHTML = ""
        elementRef.current = null
      }
      // @ts-expect-error - cleanupPromise is a function
      if (typeof cleanupPromise === "function") cleanupPromise()
    }
  }, [addressName, venueName, placeIdName, latName, lngName, setValue])

  return (
    <div>
      <div>
        <div className="mb-1">
          <label className="block text-sm font-medium text-gray-700">
            {label} {required && showAsterisk && <span className="text-error-600">*</span>}
          </label>
          {note && <p className="mt-1 text-sm text-gray-500">{note}</p>}
        </div>

        {apiError ? <div className="text-xs text-error-600 mb-1">{apiError}</div> : null}

        {/* Google renders its own input UI inside this element */}
        <div
          ref={containerRef}
          className={[
            "w-full",
            "border-gray-200 border-1 rounded-md",
            // quick styling to match your inputs a bit
            // (the element uses shadow DOM; styling is limited)
            showAddrError ? "ring-1 ring-error-600 rounded-md" : "",
          ].join(" ")}
        />

        {/* Optional fallback plain input if you want (manual entry) */}
        {/* <Input {...register(addressName as any)} placeholder="Enter address" error={showAddrError} /> */}
      </div>

      {instructionsName && (
        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700">{instructionsLabel}</label>
          <Input
            {...register(instructionsName as never)}
            placeholder={instructionsPlaceholder}
            error={showInstrError}
          />
        </div>
      )}
    </div>
  )
}
