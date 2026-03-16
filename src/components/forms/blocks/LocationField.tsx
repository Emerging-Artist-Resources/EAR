"use client"

import { useEffect, useRef, useState } from "react"
import { UseFormReturn, Path } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { loadPlacesLibrary } from "@/lib/googleMaps"

interface LocationFieldProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  addressName: Path<T>
  venueName?: Path<T>
  placeIdName?: Path<T>
  latName?: Path<T>
  lngName?: Path<T>
  instructionsName?: Path<T>
  label?: string
  note?: string
  instructionsLabel?: string
  instructionsNote?: string
  instructionsPlaceholder?: string
  required?: boolean
  showAsterisk?: boolean
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
  instructionsNote,
  instructionsPlaceholder = "Details to help attendees find the location",
  required,
  showAsterisk = true,
}: LocationFieldProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const elementRef = useRef<HTMLElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  // Watch the address field to update the Google Places element when form values change externally
  const currentAddress = form.watch(addressName) as string | undefined
  
  useEffect(() => {
    if (elementRef.current && currentAddress && (elementRef.current as any).value !== currentAddress) {
      console.log("[LocationField] Updating Google Places element value:", currentAddress)
      ;(elementRef.current as any).value = currentAddress
      if (inputRef.current) {
        inputRef.current.value = currentAddress
      }
    }
  }, [currentAddress, addressName])

  // keep aux fields registered so wizard steps don’t drop them
  useEffect(() => {
    if (venueName) form.register(venueName, { shouldUnregister: false })
    if (placeIdName) form.register(placeIdName, { shouldUnregister: false })
    if (latName) form.register(latName, { shouldUnregister: false })
    if (lngName) form.register(lngName, { shouldUnregister: false })
    if (instructionsName) form.register(instructionsName, { shouldUnregister: false })
  }, [form, venueName, placeIdName, latName, lngName, instructionsName])

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const placesLib = await loadPlacesLibrary()
        if (cancelled || !containerRef.current || elementRef.current) return

        const PlaceAutocompleteElement =
          (placesLib as any)?.PlaceAutocompleteElement ||
          (google.maps.places as any)?.PlaceAutocompleteElement

        if (!PlaceAutocompleteElement) {
          setApiError("PlaceAutocompleteElement not available. Check Places enabled + correct key.")
          return
        }

        const el = new PlaceAutocompleteElement({})
        el.style.width = "100%"

        // Set initial value from form if it exists
        const currentAddress = form.getValues(addressName) as string | undefined
        if (currentAddress) {
          el.value = currentAddress
          // Also set it on the input if it exists
          if (inputRef.current) {
            inputRef.current.value = currentAddress
          }
        }

        containerRef.current.innerHTML = ""
        containerRef.current.appendChild(el)
        elementRef.current = el

        const onPlaceSelect = async (evt: any) => {
          const { placePrediction } = evt?.detail ?? evt ?? {}
          
          let place = evt?.place ?? evt?.detail?.place
          
          if (!place && evt?.mh) {
            place = evt.mh.place ?? evt.mh.placePrediction ?? evt.mh
          }
          
          if (!place && placePrediction) {
            place = placePrediction.toPlace ? placePrediction.toPlace() : placePrediction
          }
          
          if (!place && el) {
            place = (el as any)?.place ?? (el as any)?.gmpPlace ?? (el as any)?.value
          }
          
          let elementValue = ""
          if (el && (el as any)?.value) {
            elementValue = String((el as any).value)
          }
          
          if (!place) return

          try {
            if (place && typeof place.toPlace === 'function') {
              place = place.toPlace()
            }

            if (place.fetchFields) {
              await place.fetchFields({
                fields: ["formattedAddress", "displayName", "id", "location"],
              })
            }

            const address = place.formattedAddress || place.formatted_address || (place as any)?.Sr || elementValue || ""
            const venue = place.displayName || place.display_name || (place as any)?.IC || ""
            const placeId = place.id || place.place_id || (place as any)?.RB || ""
            const loc = place.location || (place as any)?.XC || (place as any)?.vC

            form.setValue(addressName, address as any, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })

            if (venueName) form.setValue(venueName, venue as any, { shouldDirty: true })
            if (placeIdName) form.setValue(placeIdName, placeId as any, { shouldDirty: true })

            if (loc) {
              const lat = typeof loc.lat === "function" ? loc.lat() : loc.lat
              const lng = typeof loc.lng === "function" ? loc.lng() : loc.lng
              if (latName) form.setValue(latName, Number(lat) as any, { shouldDirty: true })
              if (lngName) form.setValue(lngName, Number(lng) as any, { shouldDirty: true })
            }
          } catch (e) {
            console.error("LocationField place select error:", e)
          }
        }

        el.addEventListener("gmp-select", onPlaceSelect)

        return () => {
          el.removeEventListener("gmp-select", onPlaceSelect)
        }
      } catch (e) {
        console.error(e)
        setApiError("Google Places failed to load. Check API key + restrictions.")
        return undefined
      }
    }

    const cleanupPromise = init()
    return () => {
      cancelled = true
      cleanupPromise?.then?.((cleanup) => cleanup?.())
      if (containerRef.current) containerRef.current.innerHTML = ""
      elementRef.current = null
    }
  }, [form, addressName, venueName, placeIdName, latName, lngName])

  // // ✅ THIS is what RHF validates + submits
  // const addressField = form.register(addressName, {
  //   required: required ? "Location is required" : false,
  // })

  return (
    <div>
      <div className="mb-1">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && showAsterisk ? <span className="text-error-600">*</span> : null}
        </label>
        {note ? <p className="mt-1 text-sm text-gray-500">{note}</p> : null}
      </div>

      {apiError ? <div className="text-xs text-error-600 mb-2">{apiError}</div> : null}

      {/* RHF-controlled input (typing ALWAYS updates address) */}
      {/* <Input 
        {...addressField} 
        placeholder="Start typing an address…"
        ref={(e) => {
          addressField.ref(e)
          inputRef.current = e
        }}
      /> */}

      {/* Place picker UI (selection fills placeId/lat/lng/venue) */}
      <div className="mt-2 border-2" ref={containerRef} />

      {instructionsName ? (
        <div className="mt-2">
          <div className="mb-1">
            <label className="block text-sm font-medium text-gray-700">{instructionsLabel}</label>
            {instructionsNote ? <p className="mt-1 text-sm text-gray-500">{instructionsNote}</p> : null}
          </div>
          <Input
            {...form.register(instructionsName)}
            placeholder={instructionsPlaceholder}
          />
        </div>
      ) : null}
    </div>
  )
}
