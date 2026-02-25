/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { UseFormReturn, useFieldArray, useWatch } from "react-hook-form"
import { Checkbox } from "@/components/ui/checkbox"
import { Text } from "@/components/ui/typography"
import { LocationField } from "./LocationField"
import { DateCard, createLocationFields, type DateItem, type TimeItem, type LocationConfigFull } from "./DateTime"

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

  const datesArray = useFieldArray({
    control,
    name: name as any,
  })

  const { replace, append, remove } = datesArray
  const dateFields = datesArray.fields

  const [syncTimes, setSyncTimes] = useState(false)
  const [syncLocation, setSyncLocation] = useState(true)

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
  }, [normalizedWatchedValues, name, showTime, startWithOne, replace, append, getValues, locationConfig, syncLocation, firstDateField, dateFields.length, createSignature, isEmptyInitialState, maxDates])

  const canAddDate = !maxDates || dateFields.length < maxDates

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
    if (dateFields.length < 2) return

    // Read first date times from form
    const firstTimes = getValues(`${name}.0.times` as any) as TimeItem[] | undefined
    if (!Array.isArray(firstTimes) || firstTimes.length === 0) return
    
    // Extract non-empty time strings
    const timesToSync = firstTimes
      .map((item) => item?.time)
      .filter((time): time is string => Boolean(time))
    
    if (timesToSync.length === 0) return

    // Apply to all other dates
    for (let i = 1; i < dateFields.length; i++) {
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
  }, [dateFields.length, getValues, maxTimesPerDate, name, setValue, showTime, syncTimes])

  const applyFirstLocationToAll = useCallback((forceSync = false) => {
    const shouldSync = forceSync || syncLocation
    if (!locationConfig || !shouldSync) return
    if (dateFields.length < 2) return

    // Read first location from form
    const firstAddress = getValues(`${name}.0.${locationConfig.addressName}` as any) as string | undefined
    const firstVenueName = locationConfig.venueName ? getValues(`${name}.0.${locationConfig.venueName}` as any) as string | undefined : undefined
    const firstPlaceId = locationConfig.placeIdName ? getValues(`${name}.0.${locationConfig.placeIdName}` as any) as string | undefined : undefined
    const firstLat = locationConfig.latName ? getValues(`${name}.0.${locationConfig.latName}` as any) as number | undefined : undefined
    const firstLng = locationConfig.lngName ? getValues(`${name}.0.${locationConfig.lngName}` as any) as number | undefined : undefined
    const firstInstructions = locationConfig.instructionsName ? getValues(`${name}.0.${locationConfig.instructionsName}` as any) as string | undefined : undefined

    // Only sync if first location has an address
    if (!firstAddress || firstAddress.trim() === "") return

    // Apply to all other dates
    for (let i = 1; i < dateFields.length; i++) {
      const currentAddress = getValues(`${name}.${i}.${locationConfig.addressName}` as any) as string | undefined
      
      // Only update if different
      if (currentAddress !== firstAddress) {
        if (firstAddress) {
          setValue(`${name}.${i}.${locationConfig.addressName}` as any, firstAddress as any, { shouldDirty: true })
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
        if (firstInstructions !== undefined && locationConfig.instructionsName) {
          setValue(`${name}.${i}.${locationConfig.instructionsName}` as any, firstInstructions as any, { shouldDirty: true })
        }
      }
    }
  }, [locationConfig, syncLocation, dateFields.length, name, getValues, setValue])

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
    
    // Check if all locations are the same
    const allSame = dateFields.every((_, i) => {
      if (i === 0) return true
      const otherAddress = getValues(`${name}.${i}.${locationConfig.addressName}` as any) as string | undefined
      return otherAddress === firstAddress
    })
    
    // If locations differ and syncLocation is checked, uncheck it
    if (!allSame && syncLocation) {
      setSyncLocation(false)
    }
  }, [dateFields.length, locationConfig, name, getValues, syncLocation])

  // When first location changes and sync is on -> apply to all
  // But only if locations are actually the same (don't overwrite different locations)
  useEffect(() => {
    if (!syncLocation) return
    if (!firstLocationAddress || typeof firstLocationAddress !== "string" || firstLocationAddress.trim() === "") return
    if (dateFields.length < 2) return
    
    // Check if all locations are the same before syncing
    const allSame = dateFields.every((_, i) => {
      if (i === 0) return true
      const otherAddress = getValues(`${name}.${i}.${locationConfig?.addressName}` as any) as string | undefined
      return otherAddress === firstLocationAddress
    })
    
    // Only sync if all locations are already the same
    if (allSame) {
      applyFirstLocationToAll()
    }
  }, [firstLocationAddress, applyFirstLocationToAll, syncLocation, dateFields.length, locationConfig, name, getValues])

  const handleAddDate = () => {
    if (maxDates && dateFields.length >= maxDates) return

    const lastIndex = dateFields.length - 1

    if (lastIndex >= 0) {
      const lastDate = (getValues(`${name}.${lastIndex}.date` as any) as string | undefined) ?? ""
      if (!lastDate) {
        setError(`${name}.${lastIndex}.date` as any, {
          type: "required",
          message: "Date is required",
        })
        return
      }

      if (showTime) {
        const lastTimes = (getValues(`${name}.${lastIndex}.times` as any) as TimeItem[] | undefined) ?? []
        const lastTime = lastTimes[lastTimes.length - 1]?.time ?? ""
        if (!lastTime) {
          setError(`${name}.${lastIndex}.times.${Math.max(0, lastTimes.length - 1)}.time` as any, {
            type: "required",
            message: "Time is required",
          })
          return
        }
      }
    }

    const newDate: DateItem = {
      date: "",
      times: showTime ? [{ time: "" }] : [],
      ...(locationConfig && !syncLocation ? createLocationFields(locationConfig, undefined, true) : {}),
    }
    append(newDate as any)

    if (syncTimes) {
      requestAnimationFrame(() => applyFirstTimesToAll())
    }
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

  return (
    <div className="space-y-3">
      {title && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {title} {required && showAsterisk && <span className="text-error-600">*</span>}
          </label>
          <p className="mt-1 text-sm text-gray-600">{headerNote}</p>
        </div>
      )}

      {locationConfig && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-3">
            <Checkbox
              id={`${name}-sync-location`}
              checked={syncLocation}
              onChange={(e) => {
                const checked = (e.target as any).checked
                setSyncLocation(checked)
                if (checked) {
                  // Force sync immediately when toggle is enabled
                  requestAnimationFrame(() => applyFirstLocationToAll(true))
                }
              }}
            />
            <label htmlFor={`${name}-sync-location`} className="cursor-pointer text-sm font-medium text-gray-700">
              Same location for all dates
            </label>
          </div>
          {syncLocation && (
            <LocationField
              form={form}
              addressName={`${name}.0.${locationConfig.addressName}` as any}
              venueName={locationConfig.venueName ? `${name}.0.${locationConfig.venueName}` as any : undefined}
              placeIdName={locationConfig.placeIdName ? `${name}.0.${locationConfig.placeIdName}` as any : undefined}
              latName={locationConfig.latName ? `${name}.0.${locationConfig.latName}` as any : undefined}
              lngName={locationConfig.lngName ? `${name}.0.${locationConfig.lngName}` as any : undefined}
              instructionsName={locationConfig.instructionsName ? `${name}.0.${locationConfig.instructionsName}` as any : undefined}
              label={locationConfig.label}
              note={locationConfig.note}
              instructionsLabel={locationConfig.instructionsLabel}
              instructionsPlaceholder={locationConfig.instructionsPlaceholder}
              required={locationConfig.required}
              //errorMode={errorMode}
            />
          )}
        </div>
      )}

      {showSyncToggle && (
        <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-3">
          <Checkbox
            id={`${name}-sync-times`}
            checked={syncTimes}
            onChange={(e) => {
              const checked = (e.target as any).checked
              setSyncTimes(checked)
              if (checked) {
                // Force sync immediately when toggle is enabled
                applyFirstTimesToAll(true)
              }
            }}
          />
          <label htmlFor={`${name}-sync-times`} className="cursor-pointer text-sm font-medium text-gray-700">
            Same times for all dates
          </label>
          {syncTimes && (
            <Text className="ml-2 text-xs text-gray-500">
              Times from the first date will be applied to all dates
            </Text>
          )}
        </div>
      )}

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
          />
        ))}
      </div>

      {canAddDate && (
        <button
          type="button"
          onClick={handleAddDate}
          className="mt-1 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          + Add another date
        </button>
      )}
    </div>
  )
}
