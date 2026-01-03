"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { useMemo, useState } from "react"
import { Section } from "@/components/forms/blocks/Section"
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

/**
 * Expected fields (suggested):
 * - pieceOccurrenceMode: "FROM_PARENT" | "CUSTOM"
 * - pieceOccurrenceSelections: string[]   // ids or "YYYY-MM-DD|HH:mm"
 * - pieceDate: string
 * - pieceShowTime: string
 * - pieceExtraOccurrences: { date: string; time?: string }[]
 *
 * If you don’t have these yet, you can adapt to whatever your schema uses.
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

  const ENABLE_SAMPLE_DATA = enableSampleData
  const sampleExtras: Array<{ date: string; times: Array<{ time: string }> }> = [
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
  
  const hasValidExtras = useMemo(() => {
    return extras.some(ex => {
      if (!ex?.date || !ex.date.trim()) return false
      if (!ex.times || ex.times.length === 0) return false
      return ex.times.some(t => t?.time && t.time.trim() !== "")
    })
  }, [extras])

  const displayExtras = ENABLE_SAMPLE_DATA && !hasValidExtras ? sampleExtras : extras
  const displayConfirmed = ENABLE_SAMPLE_DATA && !hasValidExtras ? true : (isConfirmed ?? false)

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

  const isUsingSampleData = ENABLE_SAMPLE_DATA && !hasValidExtras
  const hasSampleData = isUsingSampleData && sampleExtras.length > 0
  const canSelect = mode === "SELECT_FROM_PARENT" || mode === "SELECT_FROM_EVENT" || hasSampleData
  const hasParentOccurrences = canSelect && displayConfirmed && derivedOccurrences.length > 0
  
  const isSelectFromEvent = mode === "SELECT_FROM_EVENT"
  const allowManualEntry = mode === "CUSTOM_ONLY" || (mode === "SELECT_FROM_PARENT" && useCustomDateTime)
  const shouldShowCustomDateTime = allowManualEntry && (mode === "CUSTOM_ONLY" || !hasSampleData || useCustomDateTime)
  
  return (
    <Section title={label}>
      {hasParentOccurrences && !useCustomDateTime && (
        <>
          <SelectBlock
            form={form}
            name={"selectedSlots" as Path<EventFormData>}
            label="Select date(s) & time(s) for this piece"
            required
            multiple
            options={derivedOccurrences.map((o) => ({ label: o.label, value: o.key }))}
          />
          {mode === "SELECT_FROM_PARENT" && (
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

      {isSelectFromEvent && !displayConfirmed && (
        <p className="text-sm text-gray-500">
          Please confirm schedule in the Date & Time section above.
        </p>
      )}

      {isSelectFromEvent && displayConfirmed && derivedOccurrences.length === 0 && (
        <p className="text-sm text-gray-500">
          No dates & times available. Please add dates & times in the Date & Time section above and confirm them.
        </p>
      )}

      {!isSelectFromEvent && canSelect && !displayConfirmed && !useCustomDateTime && (
        <p className="text-sm text-gray-500">
          Please confirm schedule in the Date & Time section.
        </p>
      )}

      {!isSelectFromEvent && canSelect && displayConfirmed && derivedOccurrences.length === 0 && !useCustomDateTime && (
        <p className="text-sm text-gray-500">
          No dates & times available. Please add dates & times in the Date & Time section and confirm them.
        </p>
      )}

      {shouldShowCustomDateTime && (
        <>
          {hasParentOccurrences && useCustomDateTime && (
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
    </Section>
  )
}
