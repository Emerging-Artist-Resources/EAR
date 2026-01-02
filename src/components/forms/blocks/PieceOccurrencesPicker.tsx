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
  // Use useWatch for better reactivity with nested form values
  const extras = (useWatch({
    control: form.control,
    name: "extraOccurrences" as Path<EventFormData>,
    defaultValue: [],
  }) as Array<{ date: string; times: Array<{ time: string }> }> | undefined) ?? []
  
  const isConfirmed = useWatch({
    control: form.control,
    name: "eventDatesConfirmed" as Path<EventFormData>,
  }) as boolean | undefined
  
  // Also check getValues to see if values are actually in the form
  const extrasFromGetValues = (form.getValues("extraOccurrences" as Path<EventFormData>) as Array<{ date: string; times: Array<{ time: string }> }> | undefined) ?? []
  
  console.log("[PieceOccurrencesPicker] extras (from useWatch):", JSON.stringify(extras, null, 2))
  console.log("[PieceOccurrencesPicker] extras (from getValues):", JSON.stringify(extrasFromGetValues, null, 2))
  console.log("[PieceOccurrencesPicker] isConfirmed:", isConfirmed)
  console.log("[PieceOccurrencesPicker] mode:", mode)
  
  // Use getValues if watch returns empty (fallback for reactivity issues)
  const effectiveExtras = extras.length > 0 ? extras : extrasFromGetValues
  
  const derivedOccurrences = useMemo(() => {
    const list: { key: string; label: string }[] = []
    
    console.log("[PieceOccurrencesPicker] Building derivedOccurrences from effectiveExtras:", JSON.stringify(effectiveExtras, null, 2))
    
    // Build list from extraOccurrences (the main event dates/times)
    // Only include complete date+time pairs as selectable options
    for (const ex of effectiveExtras) {
      // Skip if date is missing or empty
      if (!ex?.date || !ex.date.trim()) {
        console.log("[PieceOccurrencesPicker] Skipping entry with empty date:", ex)
        continue
      }
      
      // Only include entries that have at least one time
      if (ex.times && ex.times.length > 0) {
        for (const timeItem of ex.times) {
          const time = timeItem?.time ?? ""
          // Only add if both date and time are non-empty strings
          if (time && time.trim() !== "") {
            const key = `${ex.date}|${time}`
            list.push({ key, label: `${ex.date} · ${time}` })
            console.log("[PieceOccurrencesPicker] Added occurrence:", { key, label: `${ex.date} · ${time}` })
          } else {
            console.log("[PieceOccurrencesPicker] Skipping time item with empty time:", timeItem)
          }
        }
      } else {
        console.log("[PieceOccurrencesPicker] Entry has no times array or empty times:", ex)
      }
      // Skip dates without times - user needs to complete the date/time entry first
    }
    
    console.log("[PieceOccurrencesPicker] Final derivedOccurrences:", list)
    return list
  }, [effectiveExtras])

  const canSelect = mode === "SELECT_FROM_PARENT" || mode === "SELECT_FROM_EVENT"
  
  // Only show custom DateTimeList in CUSTOM_ONLY mode
  // When mode is SELECT_FROM_EVENT, pieces should select from event occurrences only
  // This prevents conflict with the main event's extraOccurrences field
  const shouldShowCustomDateTime = mode === "CUSTOM_ONLY"

  console.log("[PieceOccurrencesPicker] Render conditions:", {
    canSelect,
    isConfirmed,
    derivedOccurrencesLength: derivedOccurrences.length,
    shouldShowSelect: canSelect && isConfirmed && derivedOccurrences.length > 0,
    shouldShowNotConfirmed: canSelect && !isConfirmed,
    shouldShowEmpty: canSelect && isConfirmed && derivedOccurrences.length === 0,
  })

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
