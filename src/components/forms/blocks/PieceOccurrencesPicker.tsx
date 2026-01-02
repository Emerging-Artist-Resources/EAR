"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { useMemo } from "react"
import { Section } from "@/components/forms/blocks/Section"
import { DateTimeList } from "@/components/forms/blocks/DateTimeList"
import { SelectBlock } from "@/components/forms/blocks/Select"
import { EventFormData } from "@/lib/validations/events"

type Mode = "SELECT_FROM_PARENT" | "SELECT_FROM_EVENT" | "CUSTOM_ONLY"

interface PieceOccurrencesPickerProps {
  form: UseFormReturn<EventFormData>
  label: string
  mode: Mode
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
export function PieceOccurrencesPicker({ form, label, mode }: PieceOccurrencesPickerProps) {
  const extras = (useWatch({
    control: form.control,
    name: "extraOccurrences" as Path<EventFormData>,
    defaultValue: [],
  }) as Array<{ date: string; times: Array<{ time: string }> }> | undefined) ?? []
  
  const isConfirmed = useWatch({
    control: form.control,
    name: "eventDatesConfirmed" as Path<EventFormData>,
  }) as boolean | undefined
  
  const derivedOccurrences = useMemo(() => {
    const list: { key: string; label: string }[] = []
    
    for (const ex of extras) {
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
  }, [extras])

  const canSelect = mode === "SELECT_FROM_PARENT" || mode === "SELECT_FROM_EVENT"
  const shouldShowCustomDateTime = mode === "CUSTOM_ONLY"

  return (
    <Section title={label}>
      {canSelect && isConfirmed && derivedOccurrences.length > 0 && (
        <SelectBlock
          form={form}
          name={"selectedSlots" as Path<EventFormData>}
          label="Select date(s) & time(s) for this piece"
          required
          multiple
          options={derivedOccurrences.map((o) => ({ label: o.label, value: o.key }))}
        />
      )}

      {canSelect && !isConfirmed && (
        <p className="text-sm text-gray-500">
          Please confirm schedule in the Date & Time section.
        </p>
      )}

      {canSelect && isConfirmed && derivedOccurrences.length === 0 && (
        <p className="text-sm text-gray-500">
          No dates & times available. Please add dates & times in the Date & Time section and confirm them.
        </p>
      )}

      {/* Only show custom DateTimeList in CUSTOM_ONLY mode (for piece submissions, not organizers) */}
      {shouldShowCustomDateTime && (
        <DateTimeList
          form={form as unknown as UseFormReturn<Record<string, unknown>>}
          title="Add your piece date(s) & time(s)"
          name="extraOccurrences"
          required
        />
      )}
    </Section>
  )
}
