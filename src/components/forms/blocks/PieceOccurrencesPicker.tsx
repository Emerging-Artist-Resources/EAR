"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { useMemo, useState, useEffect, useRef } from "react"
import { ShowtimesList } from "@/components/forms/blocks/ShowtimesList"
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
      
      // If user has selected slots, prefer FROM_PARENT mode (even if they also have custom occurrences)
      // Both can coexist now, but FROM_PARENT is the primary mode when parent selections exist
      if (selectedSlots && selectedSlots.length > 0) {
        form.setValue("pieceScheduleMode" as Path<EventFormData>, "FROM_PARENT" as never)
        // Show custom view if they have custom data
        if (hasCustomData) {
          setUseCustomDateTime(true)
        }
        scheduleModeSetRef.current = true
      } else if (hasCustomData) {
        // Only custom occurrences, no selected slots
        form.setValue("pieceScheduleMode" as Path<EventFormData>, "CUSTOM" as never)
        setUseCustomDateTime(true)
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



  // For selection dropdown, always use parent occurrences when available
  const occurrencesForSelection = useMemo(() => {
    if (mode === "SELECT_FROM_PARENT" && parentOccurrences.length > 0) {
      return parentOccurrences
    }
    if (mode === "SELECT_FROM_EVENT") {
      return extras
    }
    return []
  }, [mode, parentOccurrences, extras])

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
    
    // Show selection dropdown when we have parent occurrences (regardless of custom mode)
    const shouldShowSelection = hasParentOccurrences
    // Show custom ShowtimesList when: custom mode is enabled, OR in CUSTOM_ONLY mode, OR no parent occurrences
    const shouldShowCustomDateTime = isCustomOnly || useCustomDateTime || (isSelectFromParent && !hasParentOccurrences)

    return {
      isSelectFromEvent,
      isSelectFromParent,
      isCustomOnly,
      canSelect,
      hasParentOccurrences,
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
          {flags.isSelectFromParent && !useCustomDateTime && (
            <button
              type="button"
              onClick={() => {
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

      {flags.isSelectFromParent && !flags.shouldShowSelection && (loadingParent || !displayConfirmed) && (
        <p className="text-sm text-gray-500">
          {loadingParent ? "Loading event schedule..." : "Please wait for the event schedule to load."}
        </p>
      )}

      {flags.isSelectFromParent && !flags.shouldShowSelection && displayConfirmed && derivedOccurrences.length === 0 && (
        <p className="text-sm text-gray-500">
          No dates & times available from the event schedule.
        </p>
      )}

      {flags.shouldShowCustomDateTime && (
        <>
          <ShowtimesList
            key={customDateTimeKey}
            form={form as unknown as UseFormReturn<Record<string, unknown>>}
            title="Add your piece date(s) & time(s)"
            name="extraOccurrences"
            required
            rowLabel="Piece date"
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
              Your custom dates/times will be added to the parent event's schedule once your piece is approved.
            </p>
          )}
        </>
      )}
    </>
  )
}
