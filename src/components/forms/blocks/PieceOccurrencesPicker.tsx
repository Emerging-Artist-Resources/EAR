"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { useMemo, useState, useEffect, useRef } from "react"
import { DateTimeList } from "@/components/forms/blocks/DateTimeList"
import { SelectBlock } from "@/components/forms/blocks/Select"
import { EventFormData } from "@/lib/validations/events"
import { apiGet } from "@/lib/fetch-utils"
import { convertUTCToEST, formatTime12Hour } from "@/lib/datetime-utils"

type Mode = "SELECT_FROM_PARENT" | "SELECT_FROM_EVENT" | "CUSTOM_ONLY"

interface PieceOccurrencesPickerProps {
  form: UseFormReturn<EventFormData>
  label: string
  mode: Mode
  enableSampleData?: boolean
}

/**
 * Expected fields (suggested):
 * - pieceOccurrenceMode: "FROM_PARENT" | "CUSTOM"
 * - pieceOccurrenceSelections: string[]   // ids or "YYYY-MM-DD|HH:mm"
 * - pieceDate: string
 * - pieceShowTime: string
 * - pieceExtraOccurrences: { date: string; time?: string }[]
 *
 * If you don't have these yet, you can adapt to whatever your schema uses.
 */
interface ParentEventData {
  listing_occurrences?: Array<{
    id: string
    starts_at_utc: string
    ends_at_utc?: string | null
    tz: string
    address?: string | null
    place_id?: string | null
    lat?: number | null
    lng?: number | null
    venue_name?: string | null
    location_instructions?: string | null
  }>
}

export function PieceOccurrencesPicker({ form, label, mode }: PieceOccurrencesPickerProps) {
  const [useCustomDateTime, setUseCustomDateTime] = useState(false)
  const [loadingParent, setLoadingParent] = useState(false)
  const [customDateTimeKey, setCustomDateTimeKey] = useState(0)
  
  const parentEventId = useWatch({
    control: form.control,
    name: "parentEventId" as Path<EventFormData>,
  }) as string | undefined
  
  // For SELECT_FROM_EVENT mode, read from "occurrences" (the confirmed event dates/times)
  // For other modes, read from "extraOccurrences" (custom piece dates/times)
  const sourceField = mode === "SELECT_FROM_EVENT" ? "occurrences" : "extraOccurrences"
  
  const extras = (useWatch({
    control: form.control,
    name: sourceField as Path<EventFormData>,
    defaultValue: [],
  }) as Array<{ 
    date: string
    times: Array<{ time: string }>
    venueName?: string
    address?: string
    placeId?: string
    lat?: number
    lng?: number
    instructions?: string
  }> | undefined) ?? []
  
  const isConfirmed = useWatch({
    control: form.control,
    name: "eventDatesConfirmed" as Path<EventFormData>,
  }) as boolean | undefined

  const selectedSlots = useWatch({
    control: form.control,
    name: "selectedSlots" as Path<EventFormData>,
  }) as string[] | undefined

  const displayConfirmed = isConfirmed ?? false

  // Set pieceScheduleMode based on what the user has selected
  // Use a ref to prevent infinite loops
  const scheduleModeSetRef = useRef(false)
  useEffect(() => {
    if (mode === "SELECT_FROM_PARENT" && !scheduleModeSetRef.current) {
      // Check if user has custom occurrences
      const currentExtras = form.getValues("extraOccurrences" as Path<EventFormData>) as typeof extras
      const hasCustomData = Array.isArray(currentExtras) && 
        currentExtras.length > 0 &&
        currentExtras.some(
          (d) =>
            d?.date && d.date.trim() !== "" &&
            Array.isArray(d?.times) &&
            d.times.length > 0 &&
            d.times.some((t) => t?.time && t.time.trim() !== "")
        )
      
      // If user has custom occurrences, set to CUSTOM mode and show custom view
      if (hasCustomData) {
        form.setValue("pieceScheduleMode" as Path<EventFormData>, "CUSTOM" as never)
        setUseCustomDateTime(true)
        scheduleModeSetRef.current = true
      } else if (selectedSlots && selectedSlots.length > 0) {
        // If user has selected slots from parent, set to FROM_PARENT mode
        form.setValue("pieceScheduleMode" as Path<EventFormData>, "FROM_PARENT" as never)
        setUseCustomDateTime(false)
        scheduleModeSetRef.current = true
      }
    }
    // Reset ref when mode changes
    if (mode !== "SELECT_FROM_PARENT") {
      scheduleModeSetRef.current = false
    }
  }, [selectedSlots, mode, form, extras])

  // Store parent occurrences separately from custom additions
  const [parentOccurrences, setParentOccurrences] = useState<Array<{ 
    date: string
    times: Array<{ time: string }>
    venueName?: string
    address?: string
    placeId?: string
    lat?: number
    lng?: number
    instructions?: string
  }>>([])

  // Ensure extraOccurrences is empty when switching to custom mode (but only if it doesn't already have data)
  // Use a ref to track if we've already initialized to prevent infinite loops
  const hasInitializedRef = useRef(false)
  useEffect(() => {
    if (mode === "SELECT_FROM_PARENT" && useCustomDateTime && !hasInitializedRef.current) {
      const currentExtras = form.getValues("extraOccurrences" as Path<EventFormData>) as typeof extras
      // Only clear if it's empty or matches parent structure (user is starting fresh)
      // If it has custom data, keep it
      const hasData = Array.isArray(currentExtras) && 
        currentExtras.length > 0 &&
        currentExtras.some(
          (d) =>
            d?.date && d.date.trim() !== "" &&
            Array.isArray(d?.times) &&
            d.times.length > 0 &&
            d.times.some((t) => t?.time && t.time.trim() !== "")
        )
      
      if (!hasData) {
        // Only clear if there's no data - this means user is starting fresh
        form.setValue("extraOccurrences" as Path<EventFormData>, [] as never, { shouldDirty: false })
        setCustomDateTimeKey(prev => prev + 1)
      }
      hasInitializedRef.current = true
    }
  }, [useCustomDateTime, mode, form])

  // Fetch parent event occurrences when parentEventId is set and mode is SELECT_FROM_PARENT
  useEffect(() => {
    if (mode !== "SELECT_FROM_PARENT" || !parentEventId) {
      setParentOccurrences([])
      return
    }

    const fetchParentEvent = async () => {
      setLoadingParent(true)
      try {
        const response = await apiGet<{ data: ParentEventData } | ParentEventData>(`/api/events/${parentEventId}`)
        const data = (response as any)?.data || response
        
        if (data?.listing_occurrences && data.listing_occurrences.length > 0) {
          // Group occurrences by date and transform to form format
          const occurrencesByDate = new Map<string, Array<{
            time: string
            venueName?: string
            address?: string
            placeId?: string
            lat?: number
            lng?: number
            instructions?: string
          }>>()

          for (const occ of data.listing_occurrences) {
            if (!occ.starts_at_utc) continue
            
            // Convert UTC to EST for consistent display
            const { date: dateStr, time: estTimeStr } = convertUTCToEST(occ.starts_at_utc)
            
            if (!occurrencesByDate.has(dateStr)) {
              occurrencesByDate.set(dateStr, [])
            }
            
            occurrencesByDate.get(dateStr)!.push({
              time: estTimeStr,
              venueName: occ.venue_name || undefined,
              address: occ.address || undefined,
              placeId: occ.place_id || undefined,
              lat: occ.lat || undefined,
              lng: occ.lng || undefined,
              instructions: occ.location_instructions || undefined,
            })
          }

          // Convert to form format: Array<{ date: string, times: Array<{ time: string }>, ...location }>
          const formattedOccurrences = Array.from(occurrencesByDate.entries()).map(([date, times]) => ({
            date,
            times,
            venueName: times[0]?.venueName,
            address: times[0]?.address,
            placeId: times[0]?.placeId,
            lat: times[0]?.lat,
            lng: times[0]?.lng,
            instructions: times[0]?.instructions,
          }))

          // Store parent occurrences separately - NEVER populate extraOccurrences with them
          // extraOccurrences is only for custom additions, not parent occurrences
          setParentOccurrences(formattedOccurrences)
          
          // Mark dates as confirmed so selection dropdown can show
          // Never populate extraOccurrences - keep it empty until user adds custom dates/times
          form.setValue("eventDatesConfirmed" as Path<EventFormData>, true as never)
        } else {
          setParentOccurrences([])
        }
      } catch (error) {
        console.error("Error fetching parent event occurrences:", error)
        setParentOccurrences([])
      } finally {
        setLoadingParent(false)
      }
    }

    fetchParentEvent()
  }, [parentEventId, mode, form])



  // For selection dropdown, use parent occurrences; for custom entry, use all occurrences
  const occurrencesForSelection = useMemo(() => {
    if (mode === "SELECT_FROM_PARENT" && !useCustomDateTime && parentOccurrences.length > 0) {
      return parentOccurrences
    }
    return extras
  }, [mode, useCustomDateTime, parentOccurrences, extras])

  const derivedOccurrences = useMemo(() => {
    const list: { key: string; label: string }[] = []
    
    for (const ex of occurrencesForSelection) {
      if (!ex?.date || !ex.date.trim()) {
        continue
      }
      
      if (ex.times && ex.times.length > 0) {
        for (const timeItem of ex.times) {
          const time = timeItem?.time ?? ""
          if (time && time.trim() !== "") {
            const key = `${ex.date}|${time}`
            const time12Hour = formatTime12Hour(time)
            // Get venue name from the entry (prefer venueName, fallback to address)
            const venueName = ex.venueName || ex.address || ""
            const locationDisplay = venueName ? ` · ${venueName}` : ""
            list.push({ key, label: `${ex.date} · ${time12Hour}${locationDisplay}` })
          }
        }
      }
    }
    
    return list
  }, [occurrencesForSelection])

  const flags = useMemo(() => {
    const isSelectFromEvent = mode === "SELECT_FROM_EVENT"
    const isSelectFromParent = mode === "SELECT_FROM_PARENT"
    const isCustomOnly = mode === "CUSTOM_ONLY"
    
    const canSelect = isSelectFromParent || isSelectFromEvent
    const hasParentOccurrences = canSelect && displayConfirmed && derivedOccurrences.length > 0
    
    const allowManualEntryForParent = isSelectFromParent && (useCustomDateTime || !hasParentOccurrences)
    const allowManualEntry = isCustomOnly || allowManualEntryForParent
    // Only show custom DateTimeList if we're in custom mode OR if we don't have parent occurrences
    // When useCustomDateTime is true, we should show DateTimeList, not the selection dropdown
    const shouldShowCustomDateTime = allowManualEntry && (isCustomOnly || useCustomDateTime || !hasParentOccurrences)
    // Only show selection dropdown if we have parent occurrences AND we're NOT in custom mode
    const shouldShowSelection = hasParentOccurrences && !useCustomDateTime

    return {
      isSelectFromEvent,
      isSelectFromParent,
      isCustomOnly,
      canSelect,
      hasParentOccurrences,
      allowManualEntryForParent,
      allowManualEntry,
      shouldShowCustomDateTime,
      shouldShowSelection,
    }
  }, [mode, displayConfirmed, derivedOccurrences.length, useCustomDateTime])

  return (
    <>
      {flags.shouldShowSelection && (
        <>
          <SelectBlock
            form={form}
            name={"selectedSlots" as Path<EventFormData>}
            label={label}
            required
            multiple
            options={derivedOccurrences.map((o) => ({ label: o.label, value: o.key }))}
          />
          {flags.isSelectFromParent && (
            <button
              type="button"
              onClick={() => {
                // Clear selectedSlots when switching to custom mode
                form.setValue("selectedSlots" as Path<EventFormData>, [] as never)
                // Switch to custom mode (useEffect will handle clearing extraOccurrences)
                setUseCustomDateTime(true)
              }}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Don't see your date/time?
            </button>
          )}
        </>
      )}

      {flags.isSelectFromEvent && !displayConfirmed && (
        <p className="text-sm text-gray-500">
          Please confirm schedule in the Date & Time section above.
        </p>
      )}

      {flags.isSelectFromEvent && displayConfirmed && derivedOccurrences.length === 0 && (
        <p className="text-sm text-gray-500">
          No dates & times available. Please add dates & times in the Date & Time section above and confirm them.
        </p>
      )}

      {flags.isSelectFromParent && !flags.shouldShowCustomDateTime && (loadingParent || !displayConfirmed) && (
        <p className="text-sm text-gray-500">
          {loadingParent ? "Loading event schedule..." : "Please wait for the event schedule to load."}
        </p>
      )}

      {flags.isSelectFromParent && !flags.shouldShowCustomDateTime && displayConfirmed && derivedOccurrences.length === 0 && (
        <p className="text-sm text-gray-500">
          No dates & times available from the event schedule.
        </p>
      )}

      {flags.shouldShowCustomDateTime && (
        <>
          {flags.isSelectFromParent && useCustomDateTime && parentOccurrences.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setUseCustomDateTime(false)
                // Clear any custom occurrences when going back to selection
                form.setValue("extraOccurrences" as Path<EventFormData>, [] as never)
                form.setValue("eventDatesConfirmed" as Path<EventFormData>, true as never)
              }}
              className="mb-4 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              ← Back to selecting from parent event
            </button>
          )}
          <DateTimeList
            key={customDateTimeKey}
            form={form as unknown as UseFormReturn<Record<string, unknown>>}
            title="Add your piece date(s) & time(s)"
            name="extraOccurrences"
            required
            locationConfig={{
              addressName: "address",
              venueName: "venueName",
              placeIdName: "placeId",
              latName: "lat",
              lngName: "lng",
              instructionsName: "instructions",
              label: "Location",
              required: true,
            }}
          />
          {flags.isSelectFromParent && useCustomDateTime && parentOccurrences.length > 0 && (
            <p className="mt-2 text-sm text-gray-500">
              Your custom dates/times will be added to the parent event's schedule.
            </p>
          )}
        </>
      )}
    </>
  )
}
