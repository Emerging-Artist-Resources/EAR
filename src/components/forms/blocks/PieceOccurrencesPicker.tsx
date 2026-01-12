"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { useMemo, useState } from "react"
import { DateTimeList } from "@/components/forms/blocks/DateTimeList"
import { SelectBlock } from "@/components/forms/blocks/Select"
import { EventFormData } from "@/lib/validations/events"

type Mode = "SELECT_FROM_PARENT" | "SELECT_FROM_EVENT" | "CUSTOM_ONLY"

interface PieceOccurrencesPickerProps {
  form: UseFormReturn<EventFormData>
  label: string
  mode: Mode
  enableSampleData?: boolean
}

// Move sample data outside component to avoid recreation on every render
const SAMPLE_EXTRAS: Array<{ date: string; times: Array<{ time: string }> }> = [
  {
    date: "2024-12-15",
    times: [
      { time: "19:00" },
      { time: "21:00" }
    ]
  },
  {
    date: "2024-12-16",
    times: [
      { time: "14:00" },
      { time: "19:30" }
    ]
  },
  {
    date: "2024-12-17",
    times: [
      { time: "20:00" }
    ]
  }
]

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
export function PieceOccurrencesPicker({ form, label, mode, enableSampleData = true }: PieceOccurrencesPickerProps) {
  const [useCustomDateTime, setUseCustomDateTime] = useState(false)
  
  const extras = (useWatch({
    control: form.control,
    name: "extraOccurrences" as Path<EventFormData>,
    defaultValue: [],
  }) as Array<{ date: string; times: Array<{ time: string }> }> | undefined) ?? []
  
  const isConfirmed = useWatch({
    control: form.control,
    name: "eventDatesConfirmed" as Path<EventFormData>,
  }) as boolean | undefined

  const hasValidExtras = useMemo(() => {
    return extras.some(ex => {
      if (!ex?.date || !ex.date.trim()) return false
      if (!ex.times || ex.times.length === 0) return false
      return ex.times.some(t => t?.time && t.time.trim() !== "")
    })
  }, [extras])

  // Memoize display values to avoid recalculation on every render
  const displayExtras = useMemo(() => {
    return enableSampleData && !hasValidExtras ? SAMPLE_EXTRAS : extras
  }, [enableSampleData, hasValidExtras, extras])

  const displayConfirmed = useMemo(() => {
    return enableSampleData && !hasValidExtras ? true : (isConfirmed ?? false)
  }, [enableSampleData, hasValidExtras, isConfirmed])

  const derivedOccurrences = useMemo(() => {
    const list: { key: string; label: string }[] = []
    
    for (const ex of displayExtras) {
      if (!ex?.date || !ex.date.trim()) {
        continue
      }
      
      if (ex.times && ex.times.length > 0) {
        for (const timeItem of ex.times) {
          const time = timeItem?.time ?? ""
          if (time && time.trim() !== "") {
            const key = `${ex.date}|${time}`
            list.push({ key, label: `${ex.date} · ${time}` })
          }
        }
      }
    }
    
    return list
  }, [displayExtras])

  // Consolidate boolean flags into a single memoized object
  const flags = useMemo(() => {
    const isUsingSampleData = enableSampleData && !hasValidExtras
    const hasSampleData = isUsingSampleData && SAMPLE_EXTRAS.length > 0
    const isSelectFromEvent = mode === "SELECT_FROM_EVENT"
    const isSelectFromParent = mode === "SELECT_FROM_PARENT"
    const isCustomOnly = mode === "CUSTOM_ONLY"
    
    const canSelect = isSelectFromParent || isSelectFromEvent || hasSampleData
    const hasParentOccurrences = canSelect && displayConfirmed && derivedOccurrences.length > 0
    
    const allowManualEntryForParent = isSelectFromParent && (useCustomDateTime || !hasParentOccurrences)
    const allowManualEntry = isCustomOnly || allowManualEntryForParent
    const shouldShowCustomDateTime = allowManualEntry && (isCustomOnly || !hasSampleData || useCustomDateTime || !hasParentOccurrences)

    return {
      isUsingSampleData,
      hasSampleData,
      isSelectFromEvent,
      isSelectFromParent,
      isCustomOnly,
      canSelect,
      hasParentOccurrences,
      allowManualEntryForParent,
      allowManualEntry,
      shouldShowCustomDateTime,
    }
  }, [enableSampleData, hasValidExtras, mode, displayConfirmed, derivedOccurrences.length, useCustomDateTime])

  return (
    <>
      {flags.hasParentOccurrences && !useCustomDateTime && (
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
              onClick={() => setUseCustomDateTime(true)}
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

      {flags.isSelectFromParent && !flags.shouldShowCustomDateTime && !displayConfirmed && (
        <p className="text-sm text-gray-500">
          Please wait for the event schedule to load.
        </p>
      )}

      {flags.isSelectFromParent && !flags.shouldShowCustomDateTime && displayConfirmed && derivedOccurrences.length === 0 && (
        <p className="text-sm text-gray-500">
          No dates & times available from the event schedule.
        </p>
      )}

      {flags.shouldShowCustomDateTime && (
        <>
          {flags.hasParentOccurrences && useCustomDateTime && flags.isSelectFromParent && (
            <button
              type="button"
              onClick={() => setUseCustomDateTime(false)}
              className="mb-4 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              ← Back to selecting from parent event
            </button>
          )}
          <DateTimeList
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
        </>
      )}
    </>
  )
}
