"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { useMemo, useState, useEffect, useRef } from "react"
import { ShowtimesList } from "@/components/forms/blocks/ShowtimesList"
import { SelectBlock } from "@/components/forms/blocks/Select"
import { EventFormData } from "@/lib/validations/events"
import { apiGet } from "@/lib/fetch-utils"
import { convertUTCToEST, formatTime12Hour } from "@/lib/datetime-utils"
import { debugScheduleLog } from "@/lib/debug-log"

type Mode = "SELECT_FROM_PARENT" | "SELECT_FROM_EVENT" | "CUSTOM_ONLY"

interface PieceOccurrencesPickerProps {
  form: UseFormReturn<EventFormData>
  label: string
  mode: Mode
  enableSampleData?: boolean
  /**
   * When set (e.g. `piece` or `pieces.1`), schedule fields are namespaced so each
   * organizer program piece has its own selectedSlots / extraOccurrences / pieceScheduleMode.
   * Omit for global fields (PIECE submission flow).
   */
  scheduleKeyPrefix?: string
}

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

function schedulePaths(prefix: string | undefined) {
  const ns = prefix != null && prefix !== ""
  return {
    selectedSlots: (ns ? `${prefix}_selectedSlots` : "selectedSlots") as Path<EventFormData>,
    pieceScheduleMode: (ns ? `${prefix}_pieceScheduleMode` : "pieceScheduleMode") as Path<EventFormData>,
    extraOccurrences: (ns ? `${prefix}_extraOccurrences` : "extraOccurrences") as Path<EventFormData>,
  }
}

export function PieceOccurrencesPicker({
  form,
  label,
  mode,
  scheduleKeyPrefix,
}: PieceOccurrencesPickerProps) {
  const paths = useMemo(() => schedulePaths(scheduleKeyPrefix), [scheduleKeyPrefix])
  const [useCustomDateTime, setUseCustomDateTime] = useState(false)
  const [loadingParent, setLoadingParent] = useState(false)
  const [customDateTimeKey, setCustomDateTimeKey] = useState(0)

  const parentEventId = useWatch({
    control: form.control,
    name: "parentEventId" as Path<EventFormData>,
  }) as string | undefined

  const sourceField = mode === "SELECT_FROM_EVENT" ? "occurrences" : paths.extraOccurrences

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
    name: paths.selectedSlots,
    defaultValue: [],
  }) as string[] | undefined

  const pieceScheduleMode = useWatch({
    control: form.control,
    name: paths.pieceScheduleMode,
  }) as string | undefined

  const displayConfirmed = isConfirmed ?? false

  const scheduleModeSetRef = useRef(false)
  useEffect(() => {
    if (mode === "SELECT_FROM_PARENT" && !scheduleModeSetRef.current) {
      const currentExtras = form.getValues(paths.extraOccurrences) as typeof extras
      const hasCustomData =
        Array.isArray(currentExtras) &&
        currentExtras.length > 0 &&
        currentExtras.some(
          (d) =>
            d?.date &&
            d.date.trim() !== "" &&
            Array.isArray(d?.times) &&
            d.times.length > 0 &&
            d.times.some((t) => t?.time && t.time.trim() !== "")
        )

      if (selectedSlots && selectedSlots.length > 0) {
        form.setValue(paths.pieceScheduleMode, "FROM_PARENT" as never)
        if (hasCustomData) {
          setUseCustomDateTime(true)
        }
        scheduleModeSetRef.current = true
      } else if (hasCustomData) {
        form.setValue(paths.pieceScheduleMode, "CUSTOM" as never)
        setUseCustomDateTime(true)
        scheduleModeSetRef.current = true
      }
    }
    if (mode !== "SELECT_FROM_PARENT") {
      scheduleModeSetRef.current = false
    }
  }, [selectedSlots, mode, form, paths.extraOccurrences, paths.pieceScheduleMode])

  const [parentOccurrences, setParentOccurrences] = useState<
    Array<{
      date: string
      times: Array<{ time: string }>
      venueName?: string
      address?: string
      placeId?: string
      lat?: number
      lng?: number
      instructions?: string
    }>
  >([])

  const hasInitializedRef = useRef(false)
  useEffect(() => {
    if (mode === "SELECT_FROM_PARENT" && useCustomDateTime && !hasInitializedRef.current) {
      const currentExtras = form.getValues(paths.extraOccurrences) as typeof extras
      const hasData =
        Array.isArray(currentExtras) &&
        currentExtras.length > 0 &&
        currentExtras.some(
          (d) =>
            d?.date &&
            d.date.trim() !== "" &&
            Array.isArray(d?.times) &&
            d.times.length > 0 &&
            d.times.some((t) => t?.time && t.time.trim() !== "")
        )

      if (!hasData) {
        form.setValue(paths.extraOccurrences, [] as never, { shouldDirty: false })
        setCustomDateTimeKey((prev) => prev + 1)
      }
      hasInitializedRef.current = true
    }
  }, [useCustomDateTime, mode, form, paths.extraOccurrences])

  useEffect(() => {
    if (mode !== "SELECT_FROM_PARENT" || !parentEventId) {
      setParentOccurrences([])
      return
    }

    const fetchParentEvent = async () => {
      setLoadingParent(true)
      try {
        const response = await apiGet<{ data: ParentEventData } | ParentEventData>(`/api/events/${parentEventId}`)
        const data = (response as { data?: ParentEventData }).data ?? (response as ParentEventData)

        if (data?.listing_occurrences && data.listing_occurrences.length > 0) {
          const occurrencesByDate = new Map<
            string,
            Array<{
              time: string
              venueName?: string
              address?: string
              placeId?: string
              lat?: number
              lng?: number
              instructions?: string
            }>
          >()

          for (const occ of data.listing_occurrences) {
            if (!occ.starts_at_utc) continue

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

          setParentOccurrences(formattedOccurrences)

          form.setValue("eventDatesConfirmed" as Path<EventFormData>, true as never)
          if (process.env.NODE_ENV !== "production") {
            debugScheduleLog("[EAR piece schedule] parent event fetch OK", {
              parentEventId,
              rawListingOccurrences: data.listing_occurrences.length,
              formattedDayGroups: formattedOccurrences.length,
              eventDatesConfirmed: true,
            })
          }
        } else {
          setParentOccurrences([])
          if (process.env.NODE_ENV !== "production") {
            debugScheduleLog("[EAR piece schedule] parent event fetch — no listing_occurrences", {
              parentEventId,
            })
          }
        }
      } catch (error) {
        console.error("Error fetching parent event occurrences:", error)
        setParentOccurrences([])
      } finally {
        setLoadingParent(false)
      }
    }

    void fetchParentEvent()
  }, [parentEventId, mode, form])

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

    const shouldShowSelection = hasParentOccurrences
    const shouldShowCustomDateTime =
      isCustomOnly || useCustomDateTime || (isSelectFromParent && !hasParentOccurrences)

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

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return
    const v = form.getValues()
    debugScheduleLog("[EAR piece schedule] PieceOccurrencesPicker snapshot", {
      scheduleKeyPrefix,
      pickerMode: mode,
      parentEventId,
      pieceScheduleMode: (v as Record<string, unknown>)[String(paths.pieceScheduleMode)] ?? pieceScheduleMode,
      selectedSlots: (v as Record<string, unknown>)[String(paths.selectedSlots)],
      eventDatesConfirmed: v.eventDatesConfirmed,
      occurrences: v.occurrences,
      extraOccurrencesScoped: (v as Record<string, unknown>)[String(paths.extraOccurrences)],
      localParentOccurrencesCount: parentOccurrences.length,
      derivedSelectionOptionsCount: derivedOccurrences.length,
      useCustomDateTime,
      displayConfirmed,
      flags,
    })
  }, [
    scheduleKeyPrefix,
    mode,
    parentEventId,
    paths.pieceScheduleMode,
    paths.selectedSlots,
    paths.extraOccurrences,
    pieceScheduleMode,
    displayConfirmed,
    extras,
    parentOccurrences.length,
    derivedOccurrences.length,
    useCustomDateTime,
    flags.shouldShowSelection,
    flags.shouldShowCustomDateTime,
    flags.hasParentOccurrences,
    form,
  ])

  return (
    <>
      {flags.shouldShowSelection && (
        <>
          <SelectBlock
            form={form}
            name={paths.selectedSlots}
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
              Don&apos;t see your date/time?
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
        <p className="text-sm text-gray-500">No dates & times available from the event schedule.</p>
      )}

      {flags.shouldShowCustomDateTime && (
        <>
          <ShowtimesList
            key={customDateTimeKey}
            form={form as unknown as UseFormReturn<Record<string, unknown>>}
            title="Add your piece date(s) & time(s)"
            name={paths.extraOccurrences as unknown as string}
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
              Your custom dates/times will be added to the parent event&apos;s schedule once your piece is approved.
            </p>
          )}
        </>
      )}
    </>
  )
}
