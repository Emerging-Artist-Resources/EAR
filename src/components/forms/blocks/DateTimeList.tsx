/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { UseFormReturn, useFieldArray, useWatch } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Modal } from "@/components/ui/modal"
import { Text } from "@/components/ui/typography"
import { useToast } from "@/contexts/ToastContext"
import { LocationSection } from "./LocationSection"
import { DateCard, createLocationFields, type DateItem, type TimeItem, type LocationConfigFull } from "./DateTime"
import { clearedInPersonLocationFields, hasCompleteLocation } from "@/lib/location/mode"

interface DateTimeListProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>

  /** Field array name: array of { date, times: [{ time }] } */
  name: string

  title?: string
  note?: string
  required?: boolean
  showAsterisk?: boolean

  /** If false, time fields are hidden and optional (date-only mode) */
  showTime?: boolean

  /** Controls error display behavior */
  errorMode?: "touched" | "always"

  /** Start with one blank row if empty */
  startWithOne?: boolean

  /** Caps for single-occurrence mode */
  maxDates?: number
  maxTimesPerDate?: number

  /** Location field configuration */
  locationConfig?: LocationConfigFull
}


export function DateTimeList<T extends Record<string, unknown>>({
  form,
  name,
  title,
  note,
  required = false,
  showAsterisk = true,
  showTime = true,
  errorMode = "touched",
  startWithOne = true,
  maxDates,
  maxTimesPerDate,
  locationConfig,
}: DateTimeListProps<T>) {
  const { control, getValues, setError, setValue } = form
  const { showToast } = useToast()

  const datesArray = useFieldArray({
    control,
    name: name as any,
  })

  const { replace, append, remove } = datesArray
  const dateFields = datesArray.fields

  const [syncTimes, setSyncTimes] = useState(true)
  const [syncLocation, setSyncLocation] = useState(true)

  const [addSecondDateModalOpen, setAddSecondDateModalOpen] = useState(false)
  const [modalSameLocation, setModalSameLocation] = useState(true)
  const [modalSameTimes, setModalSameTimes] = useState(true)

  // Watch form values to detect external changes (e.g., from setValue in parent)
  const watchedFormValues = useWatch({
    control,
    name: name as any,
  }) as DateItem[] | undefined

  // Watch first date field to detect user typing vs external changes
  const firstDateField = useWatch({
    control,
    name: dateFields.length > 0 ? (`${name}.0.date` as any) : undefined,
  }) as string | undefined

  // Sync field array when form values change externally (e.g., when editing confirmed entries)
  const prevFormValuesRef = useRef<string>("")
  const isInitialMountRef = useRef(true)
  const hasInitializedRef = useRef(false)
  const initialAppendRef = useRef(false)
  
  // Helper to create a comparison signature - optimized for common cases
  const createSignature = useCallback((normalized: DateItem[]): string => {
    // For empty arrays, use simple string
    if (normalized.length === 0) return "[]"
    // For single empty entry (common initial state), use optimized signature
    if (normalized.length === 1 && normalized[0]?.date === "" && normalized[0]?.times?.length === 1 && normalized[0]?.times[0]?.time === "") {
      return `[empty]`
    }
    // Otherwise use JSON.stringify (needed for deep comparison)
    return JSON.stringify(normalized)
  }, [])
  
  // Helper to check if normalized array represents empty initial state
  const isEmptyInitialState = useCallback((normalized: DateItem[]): boolean => {
    return normalized.length === 1 && 
           normalized[0]?.date === "" && 
           (!showTime || (normalized[0]?.times?.length === 1 && normalized[0]?.times[0]?.time === ""))
  }, [showTime])
  
  // Memoize normalization of watched form values for performance
  const normalizedWatchedValues = useMemo(() => {
    if (!watchedFormValues) return undefined
    const normalized = watchedFormValues.map((d) => {
      const locationFields = createLocationFields(locationConfig, d)
      const normalizedItem: DateItem = {
        date: d?.date ?? "",
        times: showTime ? (d?.times && d.times.length > 0 ? d.times : [{ time: "" }]) : [],
        ...locationFields,
      }
      return normalizedItem
    })
    return normalized
  }, [watchedFormValues, showTime, locationConfig])
  
  useEffect(() => {
    // On mount, read from getValues() which includes defaults
    // watchedFormValues might be undefined on initial mount
    const formValuesFromGetValues = getValues(name as any) as DateItem[] | undefined
    const currentFormValues = watchedFormValues ?? formValuesFromGetValues ?? []
    
    // Use memoized normalized values if available, otherwise normalize current form values
    let normalized = normalizedWatchedValues ?? currentFormValues.map((d) => {
      const locationFields = createLocationFields(locationConfig, d)
      const normalizedItem: DateItem = {
        date: d?.date ?? "",
        times: showTime ? (d?.times && d.times.length > 0 ? d.times : [{ time: "" }]) : [],
        ...locationFields,
      }
      return normalizedItem
    })

    // Enforce maxDates constraint: trim excess entries if switching from a form that allows multiple dates
    // to one that only allows a single date (e.g., performance -> audition)
    if (maxDates !== undefined && normalized.length > maxDates) {
      // Keep only the first maxDates items
      normalized = normalized.slice(0, maxDates)
    }

    // Create signature to detect changes - optimized for performance
    const signature = createSignature(normalized)
    
    // On initial mount, initialize field array from form values or add blank row
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      if (normalized.length > 0) {
        const hasCompleteEntries = normalized.some(d => d.date && d.date.trim() !== "")
        if (hasCompleteEntries) {
          prevFormValuesRef.current = signature
          hasInitializedRef.current = true
          replace(normalized as any)
          return
        }
      }
      // CRITICAL: Check ref FIRST before any other logic to prevent race conditions
      if (startWithOne && dateFields.length === 0 && !initialAppendRef.current) {
        // Double-check: if ref was set between the condition check and here, abort
        if (initialAppendRef.current) {
          return
        }
        const initial: DateItem = {
          date: "",
          times: showTime ? [{ time: "" }] : [],
          ...(locationConfig && !syncLocation ? createLocationFields(locationConfig, undefined, true) : {}),
        }
        // CRITICAL: Only use replace if watchedFormValues has VALID date items (with date field)
        // If watchedFormValues only has location fields or invalid items, proceed with append
        if (watchedFormValues && watchedFormValues.length > 0) {
          const hasValidDateItems = watchedFormValues.some(d => d?.date && d.date.trim() !== "")
          if (hasValidDateItems) {
            const normalized = normalizedWatchedValues ?? watchedFormValues.map((d) => {
              const locationFields = createLocationFields(locationConfig, d)
              return {
                date: d?.date ?? "",
                times: showTime ? (d?.times && d.times.length > 0 ? d.times : [{ time: "" }]) : [],
                ...locationFields,
              }
            })
            prevFormValuesRef.current = createSignature(normalized)
            hasInitializedRef.current = true
            replace(normalized as any)
            return
          }
        }
        // CRITICAL: Set ref IMMEDIATELY before replace to prevent duplicate appends during async re-renders
        initialAppendRef.current = true
        // Use replace with single item instead of append to avoid potential duplicates
        replace([initial] as any)
        // Set signature to prevent re-triggering
        prevFormValuesRef.current = createSignature([initial])
        hasInitializedRef.current = true
        return
      } else {
        prevFormValuesRef.current = signature
        hasInitializedRef.current = true
      }
      return
    }
    
    // Skip if we just initialized with an append and this is the watchedFormValues catching up
    // This prevents duplicate blocks when watchedFormValues updates after initial append
    if (initialAppendRef.current && dateFields.length === 1 && normalized.length === 1) {
      // If this is just the watchedFormValues reflecting our initial append, skip sync
      if (isEmptyInitialState(normalized)) {
        // Update signature to match what's now in watchedFormValues
        prevFormValuesRef.current = createSignature(normalized)
        // Clear the flag after handling the first update
        initialAppendRef.current = false
        return
      }
      // If we get here, something else changed, so clear the flag and continue
      initialAppendRef.current = false
    }
    
    // Additional guard: if field array already has the right number of empty entries,
    // and normalized matches that, skip sync to prevent duplicates
    if (dateFields.length > 0 && 
        dateFields.length === normalized.length && 
        isEmptyInitialState(normalized) &&
        !normalized.some(d => d.date && d.date.trim() !== "")) {
      // Field array already has empty entries matching normalized - no need to sync
      prevFormValuesRef.current = signature
      return
    }
    
    // Skip if no change
    if (signature === prevFormValuesRef.current) {
      return
    }
    
    // Sync if external changes detected
    const lengthMismatch = dateFields.length !== normalized.length
    const formHasCompleteEntries = normalized.some(d => d.date && d.date.trim() !== "")
    const firstEntryFormDate = normalized[0]?.date ?? ""
    
    // Detect if user is typing (first entry matches current typed value)
    // vs external setValue (first entry doesn't match or length changed)
    const userTyping = dateFields.length > 0 && 
                       normalized.length > 0 && 
                       firstDateField === firstEntryFormDate &&
                       !lengthMismatch
    
    // Sync if:
    // 1. Length changed (definitely external)
    // 2. OR form has complete entries and field array is empty (restoring)
    // 3. OR form has complete entries and user is NOT typing (external change)
    const shouldSync = lengthMismatch || 
      (formHasCompleteEntries && dateFields.length === 0) ||
      (formHasCompleteEntries && !userTyping)
    
    if (shouldSync) {
      prevFormValuesRef.current = signature
      replace(normalized as any)
    } else {
      // Update ref to track current state, but don't replace (user is typing)
      // CRITICAL: Don't overwrite prevSignature if we just did an initial append and watchedFormValues hasn't caught up yet
      if (!initialAppendRef.current || normalized.length > 0) {
        prevFormValuesRef.current = signature
      }
    }
  }, [normalizedWatchedValues, name, showTime, startWithOne, replace, getValues, locationConfig, syncLocation, firstDateField, dateFields.length, createSignature, isEmptyInitialState, maxDates])

  const canAddDate = !maxDates || dateFields.length < maxDates

  const allowsMultipleDates = !maxDates || maxDates > 1

  const firstTimes = useWatch({
    control,
    name: showTime && syncTimes && dateFields.length > 0 ? (`${name}.0.times` as any) : undefined,
  }) as TimeItem[] | undefined

  // Watch first location address when syncLocation is enabled
  const firstLocationAddress = useWatch({
    control,
    name: locationConfig && syncLocation && dateFields.length > 0 ? (`${name}.0.${locationConfig.addressName}` as any) : undefined,
  }) as string | undefined

  const applyFirstTimesToAll = useCallback((forceSync = false) => {
    const shouldSync = forceSync || syncTimes
    if (!showTime || !shouldSync) return

    const rows = getValues(name as any) as DateItem[] | undefined
    const rowCount = Array.isArray(rows) ? rows.length : 0
    if (rowCount < 2) return

    // Read first date times from form
    const firstTimes = getValues(`${name}.0.times` as any) as TimeItem[] | undefined
    if (!Array.isArray(firstTimes) || firstTimes.length === 0) return
    
    // Extract non-empty time strings
    const timesToSync = firstTimes
      .map((item) => item?.time)
      .filter((time): time is string => Boolean(time))
    
    if (timesToSync.length === 0) return

    // Apply to all other dates
    for (let i = 1; i < rowCount; i++) {
      const currentTimes = getValues(`${name}.${i}.times` as any) as TimeItem[] | undefined
      const current = Array.isArray(currentTimes) ? currentTimes : []
      const currentList = current
        .map((item) => item?.time)
        .filter((time): time is string => Boolean(time))

      // Only update if different
      if (currentList.join("|") !== timesToSync.join("|")) {
        const capped = maxTimesPerDate ? timesToSync.slice(0, maxTimesPerDate) : timesToSync
        setValue(
          `${name}.${i}.times` as any,
          capped.map((time) => ({ time })) as any,
          { shouldDirty: true },
        )
      }
    }
  }, [getValues, maxTimesPerDate, name, setValue, showTime, syncTimes])

  const applyFirstLocationToAll = useCallback((forceSync = false) => {
    const shouldSync = forceSync || syncLocation
    if (!locationConfig || !shouldSync) return

    const rows = getValues(name as any) as DateItem[] | undefined
    const rowCount = Array.isArray(rows) ? rows.length : 0
    if (rowCount < 2) return

    const modeKey = locationConfig.locationModeName ?? "locationMode"
    const firstMode = getValues(`${name}.0.${modeKey}` as any) as string | undefined
    const firstAddress = getValues(`${name}.0.${locationConfig.addressName}` as any) as string | undefined
    const firstVenueName = locationConfig.venueName
      ? (getValues(`${name}.0.${locationConfig.venueName}` as any) as string | undefined)
      : undefined
    const firstPlaceId = locationConfig.placeIdName
      ? (getValues(`${name}.0.${locationConfig.placeIdName}` as any) as string | undefined)
      : undefined
    const firstLat = locationConfig.latName
      ? (getValues(`${name}.0.${locationConfig.latName}` as any) as number | undefined)
      : undefined
    const firstLng = locationConfig.lngName
      ? (getValues(`${name}.0.${locationConfig.lngName}` as any) as number | undefined)
      : undefined
    const firstInstructions = locationConfig.instructionsName
      ? (getValues(`${name}.0.${locationConfig.instructionsName}` as any) as string | undefined)
      : undefined

    const firstLocation = {
      locationMode: firstMode,
      address: firstAddress,
      venueName: firstVenueName,
      placeId: firstPlaceId,
      locationInstructions: firstInstructions,
    }
    if (!hasCompleteLocation(firstLocation)) return

    for (let i = 1; i < rowCount; i++) {
      setValue(`${name}.${i}.${modeKey}` as any, firstMode as any, { shouldDirty: true })
      if (firstInstructions !== undefined && locationConfig.instructionsName) {
        setValue(`${name}.${i}.${locationConfig.instructionsName}` as any, firstInstructions as any, {
          shouldDirty: true,
        })
      }
      const cleared = clearedInPersonLocationFields()
      if (firstAddress) {
        setValue(`${name}.${i}.${locationConfig.addressName}` as any, firstAddress as any, { shouldDirty: true })
      } else {
        setValue(`${name}.${i}.${locationConfig.addressName}` as any, cleared.address as any, { shouldDirty: true })
      }
      if (firstVenueName !== undefined && locationConfig.venueName) {
        setValue(`${name}.${i}.${locationConfig.venueName}` as any, firstVenueName as any, { shouldDirty: true })
      }
      if (firstPlaceId !== undefined && locationConfig.placeIdName) {
        setValue(`${name}.${i}.${locationConfig.placeIdName}` as any, firstPlaceId as any, { shouldDirty: true })
      }
      if (firstLat !== undefined && locationConfig.latName) {
        setValue(`${name}.${i}.${locationConfig.latName}` as any, firstLat as any, { shouldDirty: true })
      }
      if (firstLng !== undefined && locationConfig.lngName) {
        setValue(`${name}.${i}.${locationConfig.lngName}` as any, firstLng as any, { shouldDirty: true })
      }
    }
  }, [locationConfig, syncLocation, name, getValues, setValue])

  // When first date times change and sync is on -> apply to all
  useEffect(() => {
    if (!syncTimes) return
    if (!firstTimes || firstTimes.length === 0) return
    applyFirstTimesToAll()
  }, [firstTimes, applyFirstTimesToAll, syncTimes])

  // Detect if locations differ and automatically uncheck syncLocation if they do
  useEffect(() => {
    if (!locationConfig) return
    if (dateFields.length < 2) return
    
    const firstAddress = getValues(`${name}.0.${locationConfig.addressName}` as any) as string | undefined
    if (!firstAddress || typeof firstAddress !== "string" || firstAddress.trim() === "") return

    const firstNorm = firstAddress.trim()
    
    // Secondary rows often have no address field yet while "same location" is on (copy runs in rAF).
    // Treat empty as "not a conflict" — only uncheck when another row has a *non-empty* different address.
    const allCompatible = dateFields.every((_, i) => {
      if (i === 0) return true
      const otherAddress = getValues(`${name}.${i}.${locationConfig.addressName}` as any) as string | undefined
      const o = (typeof otherAddress === "string" ? otherAddress : "").trim()
      if (o === "") return true
      return o === firstNorm
    })
    
    if (!allCompatible && syncLocation) {
      setSyncLocation(false)
    }
  }, [dateFields.length, locationConfig, name, getValues, setSyncLocation, syncLocation])

  // When first location changes and sync is on -> apply to all
  // But only if we won't overwrite a deliberately different non-empty venue on another row
  useEffect(() => {
    if (!syncLocation) return
    if (!firstLocationAddress || typeof firstLocationAddress !== "string" || firstLocationAddress.trim() === "") return
    if (dateFields.length < 2) return

    const firstNorm = firstLocationAddress.trim()
    
    const safeToSyncFromFirst = dateFields.every((_, i) => {
      if (i === 0) return true
      const otherAddress = getValues(`${name}.${i}.${locationConfig?.addressName}` as any) as string | undefined
      const o = (typeof otherAddress === "string" ? otherAddress : "").trim()
      if (o === "") return true
      return o === firstNorm
    })
    
    if (safeToSyncFromFirst) {
      applyFirstLocationToAll()
    }
  }, [firstLocationAddress, applyFirstLocationToAll, syncLocation, dateFields.length, locationConfig, name, getValues, setSyncLocation])

  const validateLastDateBeforeAdd = useCallback((): boolean => {
    const lastIndex = dateFields.length - 1
    if (lastIndex < 0) return true

    const lastDate = (getValues(`${name}.${lastIndex}.date` as any) as string | undefined) ?? ""
    if (!lastDate) {
      setError(`${name}.${lastIndex}.date` as any, {
        type: "required",
        message: "Date is required",
      })
      return false
    }

    if (showTime) {
      const lastTimes = (getValues(`${name}.${lastIndex}.times` as any) as TimeItem[] | undefined) ?? []
      const lastTime = lastTimes[lastTimes.length - 1]?.time ?? ""
      if (!lastTime) {
        setError(`${name}.${lastIndex}.times.${Math.max(0, lastTimes.length - 1)}.time` as any, {
          type: "required",
          message: "Time is required",
        })
        return false
      }
    }

    return true
  }, [dateFields.length, getValues, name, setError, showTime])

  const appendNewDateRow = useCallback(
    (nextSyncLocation: boolean, nextSyncTimes: boolean, showSyncToasts: boolean) => {
      const newDate: DateItem = {
        date: "",
        times: showTime ? [{ time: "" }] : [],
        ...(locationConfig && !nextSyncLocation ? createLocationFields(locationConfig, undefined, true) : {}),
      }
      append(newDate as any)

      requestAnimationFrame(() => {
        if (nextSyncTimes && showTime) {
          applyFirstTimesToAll(true)
        }
        if (nextSyncLocation && locationConfig) {
          applyFirstLocationToAll(true)
        }
        if (showSyncToasts) {
          if (nextSyncTimes && showTime) {
            showToast("Times synced across all dates.", "success")
          }
          if (nextSyncLocation && locationConfig) {
            showToast("Locations synced across all dates.", "success")
          }
        }
      })
    },
    [
      append,
      applyFirstLocationToAll,
      applyFirstTimesToAll,
      locationConfig,
      showTime,
      showToast,
    ],
  )

  const secondDateModalHasQuestions = Boolean(locationConfig) || showTime

  const handleAddDate = () => {
    if (maxDates && dateFields.length >= maxDates) return
    if (!validateLastDateBeforeAdd()) return

    const isFirstSecondDate =
      dateFields.length === 1 && allowsMultipleDates && secondDateModalHasQuestions

    if (isFirstSecondDate) {
      setModalSameLocation(syncLocation)
      setModalSameTimes(syncTimes)
      setAddSecondDateModalOpen(true)
      return
    }

    appendNewDateRow(syncLocation, syncTimes, false)
  }

  const handleConfirmSecondDateModal = () => {
    setSyncLocation(modalSameLocation)
    setSyncTimes(modalSameTimes)
    setAddSecondDateModalOpen(false)
    appendNewDateRow(modalSameLocation, modalSameTimes, true)
  }

  const headerNote = useMemo(() => {
    if (note) return note
    if (!showTime) return "Add one or more dates."
    if (maxDates === 1 && maxTimesPerDate === 1) return "Add the date and time."
    return "Add one or more times per date, and add multiple dates as needed."
  }, [note, showTime, maxDates, maxTimesPerDate])

  const showSyncToggle =
    showTime &&
    dateFields.length > 1 &&
    (!maxDates || maxDates > 1) &&
    (!maxTimesPerDate || maxTimesPerDate > 0)

  const showLocationSyncCheckbox = Boolean(locationConfig && dateFields.length >= 2)

  const sharedDetailsSection =
    dateFields.length >= 2 && (locationConfig || showSyncToggle)

  const sharedSectionTitle =
    locationConfig && showSyncToggle
      ? "Venue & matching"
      : locationConfig
        ? "Venue"
        : "Matching start times"

  const sharedSectionBlurb =
    locationConfig && showSyncToggle
      ? "When every day uses the same room or start time, keep them in sync here. Turn off an option if one occurrence differs — you can edit per-day details in the cards above."
      : locationConfig
        ? "Use one address for every occurrence, or turn off the option below to set a different venue inside each card."
        : "When every day starts at the same time, keep them in sync here. Turn off to set times separately in each card."

  /** Label for the section that appears once two dates exist (modal copy while still on one date). */
  const sectionNameAfterSecondDate =
    locationConfig && showTime ? "Venue & matching" : locationConfig ? "Venue" : "Matching start times"

  return (
    <div className="space-y-6">
      {title && (
        <header className="space-y-1.5 border-b border-gray-200/80 pb-4">
          <label className="block text-base font-semibold tracking-tight text-gray-900">
            {title} {required && showAsterisk && <span className="text-error-600">*</span>}
          </label>
          <p className="text-sm leading-relaxed text-gray-600">{headerNote}</p>
        </header>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {dateFields.length === 1 ? "First occurrence" : "All occurrences"}
          </p>
          {dateFields.length > 1 && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {dateFields.length} dates
            </span>
          )}
        </div>
        <div className="space-y-4">
          {dateFields.map((field, index) => (
            <DateCard
              key={`${field.id}-${index}`}
              form={form as any}
              name={name}
              index={index}
              removeDate={remove}
              showTime={showTime}
              errorMode={errorMode}
              disableRemove={index === 0 || (maxDates === 1)}
              isFirst={index === 0}
              maxTimesPerDate={maxTimesPerDate}
              onFirstDateTimesChange={() => {
                if (syncTimes) applyFirstTimesToAll()
              }}
              locationConfig={locationConfig}
              syncLocation={syncLocation}
              totalOccurrences={dateFields.length}
            />
          ))}
        </div>
      </div>

      {locationConfig && !sharedDetailsSection && (
        <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ring-1 ring-gray-950/5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{locationConfig.label || "Venue"}</h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">
              Search for the address so we can show it on the map and in listings.
            </p>
          </div>
          {syncLocation && (
            <LocationSection
              form={form}
              modeName={`${name}.0.${locationConfig.locationModeName ?? "locationMode"}` as any}
              addressName={`${name}.0.${locationConfig.addressName}` as any}
              venueName={locationConfig.venueName ? `${name}.0.${locationConfig.venueName}` as any : undefined}
              placeIdName={locationConfig.placeIdName ? `${name}.0.${locationConfig.placeIdName}` as any : undefined}
              latName={locationConfig.latName ? `${name}.0.${locationConfig.latName}` as any : undefined}
              lngName={locationConfig.lngName ? `${name}.0.${locationConfig.lngName}` as any : undefined}
              instructionsName={locationConfig.instructionsName ? `${name}.0.${locationConfig.instructionsName}` as any : undefined}
              label={locationConfig.label}
              labelTooltip={locationConfig.labelTooltip}
              note={locationConfig.note}
              instructionsLabel={locationConfig.instructionsLabel}
              instructionsPlaceholder={locationConfig.instructionsPlaceholder}
              required={locationConfig.required}
            />
          )}
        </section>
      )}

      {sharedDetailsSection && (
        <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ring-1 ring-gray-950/5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{sharedSectionTitle}</h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">{sharedSectionBlurb}</p>
          </div>

          <div className="space-y-3">
            {showLocationSyncCheckbox && (
              <div className="flex gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-3">
                <Checkbox
                  id={`${name}-sync-location`}
                  className="mt-0.5 shrink-0"
                  checked={syncLocation}
                  onChange={(e) => {
                    const checked = (e.target as HTMLInputElement).checked
                    setSyncLocation(checked)
                    if (checked) {
                      requestAnimationFrame(() => applyFirstLocationToAll(true))
                    }
                  }}
                />
                <div className="min-w-0">
                  <label htmlFor={`${name}-sync-location`} className="cursor-pointer text-sm font-medium text-gray-900">
                    Same location for all dates
                  </label>
                  <p className="mt-0.5 text-xs leading-snug text-gray-600">
                    One address applies to every occurrence. Uncheck to set a different venue inside each card.
                  </p>
                </div>
              </div>
            )}

            {locationConfig && syncLocation && (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white/80 p-3">
                <LocationSection
                  form={form}
                  modeName={`${name}.0.${locationConfig.locationModeName ?? "locationMode"}` as any}
                  addressName={`${name}.0.${locationConfig.addressName}` as any}
                  venueName={locationConfig.venueName ? `${name}.0.${locationConfig.venueName}` as any : undefined}
                  placeIdName={locationConfig.placeIdName ? `${name}.0.${locationConfig.placeIdName}` as any : undefined}
                  latName={locationConfig.latName ? `${name}.0.${locationConfig.latName}` as any : undefined}
                  lngName={locationConfig.lngName ? `${name}.0.${locationConfig.lngName}` as any : undefined}
                  instructionsName={locationConfig.instructionsName ? `${name}.0.${locationConfig.instructionsName}` as any : undefined}
                  label={locationConfig.label}
                  labelTooltip={locationConfig.labelTooltip}
                  note={locationConfig.note}
                  instructionsLabel={locationConfig.instructionsLabel}
                  instructionsPlaceholder={locationConfig.instructionsPlaceholder}
                  required={locationConfig.required}
                />
              </div>
            )}

            {showSyncToggle && (
              <div className="flex gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-3">
                <Checkbox
                  id={`${name}-sync-times`}
                  className="mt-0.5 shrink-0"
                  checked={syncTimes}
                  onChange={(e) => {
                    const checked = (e.target as HTMLInputElement).checked
                    setSyncTimes(checked)
                    if (checked) {
                      applyFirstTimesToAll(true)
                    }
                  }}
                />
                <div className="min-w-0 flex-1">
                  <label htmlFor={`${name}-sync-times`} className="cursor-pointer text-sm font-medium text-gray-900">
                    Same times for all dates
                  </label>
                  <p className="mt-0.5 text-xs leading-snug text-gray-600">
                    Start times from the first occurrence copy to the others. Edit the first row to update them all.
                  </p>
                  {syncTimes && (
                    <Text className="mt-2 text-xs text-primary-700">Sync is on — times follow occurrence 1.</Text>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {canAddDate && (
        <Button type="button" variant="outline" className="w-full border-dashed sm:w-auto" onClick={handleAddDate}>
          + Add another date
        </Button>
      )}

      <Modal
        isOpen={addSecondDateModalOpen}
        onClose={() => setAddSecondDateModalOpen(false)}
        title="Add a second date"
        size="sm"
        headerClassName="bg-primary text-white"
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-gray-600">
            Tell us whether this new day matches your first occurrence. You can always change this in{" "}
            <span className="font-medium text-gray-800">{sectionNameAfterSecondDate}</span> after the second date is
            added.
          </p>
          <div className="space-y-3">
            {locationConfig && (
              <div className="flex gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-3">
                <Checkbox
                  id={`${name}-modal-same-location`}
                  className="mt-0.5 shrink-0"
                  checked={modalSameLocation}
                  onChange={(e) => setModalSameLocation((e.target as HTMLInputElement).checked)}
                />
                <div>
                  <label htmlFor={`${name}-modal-same-location`} className="cursor-pointer text-sm font-medium text-gray-900">
                    Same venue as the first date
                  </label>
                  <p className="mt-0.5 text-xs text-gray-600">Reuse the address you already entered.</p>
                </div>
              </div>
            )}
            {showTime && (
              <div className="flex gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-3">
                <Checkbox
                  id={`${name}-modal-same-times`}
                  className="mt-0.5 shrink-0"
                  checked={modalSameTimes}
                  onChange={(e) => setModalSameTimes((e.target as HTMLInputElement).checked)}
                />
                <div>
                  <label htmlFor={`${name}-modal-same-times`} className="cursor-pointer text-sm font-medium text-gray-900">
                    Same start time(s) as the first date
                  </label>
                  <p className="mt-0.5 text-xs text-gray-600">Copies curtain times from occurrence 1.</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setAddSecondDateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="w-full sm:w-auto" onClick={handleConfirmSecondDateModal}>
              Add second date
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
