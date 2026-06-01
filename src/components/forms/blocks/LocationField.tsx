"use client"

import { useEffect, useId, useRef, useState } from "react"
import { UseFormReturn, Path } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { loadPlacesLibrary } from "@/lib/location/google-maps-loader"
import { coerceLocationFieldString } from "@/lib/location/mode"

export type LocationFieldInstructionsProps<T extends Record<string, unknown>> = {
  form: UseFormReturn<T>
  instructionsName: Path<T>
  instructionsLabel?: string
  instructionsNote?: string
  instructionsPlaceholder?: string
  /** When set, instructions are hidden until "+ Add instructions" (auto-opens if a value is already set). */
  instructionsCollapsible?: boolean
  className?: string
  /** e.g. no top margin on the add button when the block sits in its own row */
  addButtonTightTop?: boolean
  /** When to show validation messages (aligns with date/time fields in showtime & date cards). */
  errorMode?: "touched" | "always"
}

/** Renders only the instructions / optional "+ Add instructions" block (register is owned by the parent `LocationField`). */
export function LocationFieldInstructions<T extends Record<string, unknown>>({
  form,
  instructionsName,
  instructionsLabel = "Location Instructions",
  instructionsNote,
  instructionsPlaceholder = "Details to help attendees find the location",
  instructionsCollapsible = false,
  className,
  addButtonTightTop = false,
  errorMode = "touched",
}: LocationFieldInstructionsProps<T>) {
  const instructionsFieldId = useId()
  const instructionsWatched = form.watch(instructionsName) as string | undefined
  // Subscribe to validation state (Zod / superRefine on this path)
  void form.formState.errors
  const instState = form.getFieldState(instructionsName, form.formState)
  const showInstErr =
    instState.error &&
    (errorMode === "always" ||
      instState.isTouched ||
      form.formState.isSubmitted ||
      form.formState.submitCount > 0)
  const instErrMsg = showInstErr ? (instState.error?.message as string | undefined) : undefined
  const hasInstructionsContent = Boolean(
    instructionsWatched && String(instructionsWatched).trim() !== ""
  )
  const [instructionsOpen, setInstructionsOpen] = useState(
    !instructionsCollapsible || hasInstructionsContent
  )

  useEffect(() => {
    if (hasInstructionsContent) setInstructionsOpen(true)
  }, [hasInstructionsContent])

  if (instructionsCollapsible && !instructionsOpen) {
    return (
      <button
        type="button"
        className={`w-full text-left text-sm font-medium text-primary-700 hover:text-primary-800 sm:w-auto ${
          addButtonTightTop ? "mt-0" : "mt-2"
        } ${className ?? ""}`}
        onClick={() => setInstructionsOpen(true)}
      >
        + Add instructions
      </button>
    )
  }

  return (
    <div className={className}>
      {instructionsCollapsible && instructionsOpen ? (
        <div className="mb-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-medium text-gray-700" htmlFor={String(instructionsFieldId)}>
              {instructionsLabel}
            </label>
            {!hasInstructionsContent && (
              <button
                type="button"
                className="shrink-0 text-xs text-gray-500 hover:text-gray-700"
                onClick={() => setInstructionsOpen(false)}
              >
                Close
              </button>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            {instructionsNote || "Provide details to help attendees find the space."}
          </p>
        </div>
      ) : (
        <div className="mb-1">
          <label className="block text-sm font-medium text-gray-700" htmlFor={String(instructionsFieldId)}>
            {instructionsLabel}
          </label>
          {instructionsNote ? <p className="mt-1 text-sm text-gray-500">{instructionsNote}</p> : null}
        </div>
      )}
      <Input
        id={String(instructionsFieldId)}
        error={Boolean(instErrMsg)}
        {...form.register(instructionsName)}
        placeholder={instructionsPlaceholder}
      />
      {instErrMsg ? <p className="mt-1 text-xs text-error-600">{instErrMsg}</p> : null}
    </div>
  )
}

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
  /** Tighter top margin on the place picker (e.g. horizontal showtime row). */
  compact?: boolean
  /** When set with instructionsName, instructions are hidden until "+ Add instructions" (auto-opens if a value is already set). */
  instructionsCollapsible?: boolean
  className?: string
  /**
   * When `false` (and you still pass `instructionsName` for registration), the address+map
   * render only; use `LocationFieldInstructions` in the parent to render instructions elsewhere
   * so expanding instructions does not shift the address row.
   */
  includeInstructionsInPlace?: boolean
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
  instructionsNote,
  instructionsPlaceholder = "Provide details to help attendees find the space.",
  required,
  showAsterisk = true,
  compact = false,
  instructionsCollapsible = false,
  className,
  includeInstructionsInPlace = true,
  errorMode = "touched",
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

  // Register address + hidden aux fields so Zod/RHF can attach errors and values (address is set via Places `setValue`).
  useEffect(() => {
    form.register(addressName, { shouldUnregister: false })
    if (venueName) form.register(venueName, { shouldUnregister: false })
    if (placeIdName) form.register(placeIdName, { shouldUnregister: false })
    if (latName) form.register(latName, { shouldUnregister: false })
    if (lngName) form.register(lngName, { shouldUnregister: false })
  }, [form, addressName, venueName, placeIdName, latName, lngName])

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
        el.classList.add("ear-place-autocomplete")
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
            const venue = coerceLocationFieldString(
              place.displayName || place.display_name || (place as any)?.IC || "",
            )
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

  const mapClassName = compact ? "mt-0 border-2" : "mt-2 border-2"

  void form.formState.errors
  const addressState = form.getFieldState(addressName, form.formState)
  const showAddressErr =
    addressState.error &&
    (errorMode === "always" ||
      addressState.isTouched ||
      form.formState.isSubmitted ||
      form.formState.submitCount > 0)
  const addressErrMsg = showAddressErr ? (addressState.error?.message as string | undefined) : undefined

  return (
    <div className={className}>
      <div className={compact ? "mb-1.5" : "mb-1"}>
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && showAsterisk ? <span className="text-error-600">*</span> : null}
        </label>
        {note && !compact ? <p className="mt-1 text-sm text-gray-500">{note}</p> : null}
      </div>

      {apiError ? <div className="text-xs text-error-600 mb-2">{apiError}</div> : null}
      {addressErrMsg ? <p className="mb-2 text-xs text-error-600" role="alert">{addressErrMsg}</p> : null}

      {/* Place picker UI (selection fills placeId/lat/lng/venue) */}
      <div className={mapClassName} ref={containerRef} />

      {includeInstructionsInPlace && instructionsName ? (
        <LocationFieldInstructions
          form={form}
          instructionsName={instructionsName}
          instructionsLabel={instructionsLabel}
          instructionsNote={instructionsNote}
          instructionsPlaceholder={instructionsPlaceholder}
          instructionsCollapsible={instructionsCollapsible}
          addButtonTightTop={false}
          errorMode={errorMode}
        />
      ) : null}
    </div>
  )
}
