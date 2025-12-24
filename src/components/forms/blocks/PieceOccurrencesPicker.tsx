"use client"

import { UseFormReturn, Path } from "react-hook-form"
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
  // TODO: Replace with real parent/event occurrences once you have search + event lookup.
  // For now, you can derive from the organizer's `date/showTime/extraOccurrences` if mode === SELECT_FROM_EVENT.
  const derivedOccurrences = useMemo(() => {
    const primaryDate = form.getValues("date" as Path<EventFormData>) as string | undefined
    const primaryTime = form.getValues("showTime" as Path<EventFormData>) as string | undefined
    const extras = (form.getValues("extraOccurrences" as Path<EventFormData>) as Array<{ date: string; times: Array<{ time: string }> }> | undefined) ?? []

    const list: { key: string; label: string }[] = []
    if (primaryDate) {
      const key = `${primaryDate}|${primaryTime ?? ""}`
      list.push({ key, label: `${primaryDate}${primaryTime ? ` · ${primaryTime}` : ""}` })
    }
    for (const ex of extras) {
      if (!ex?.date) continue
      const firstTime = ex.times?.[0]?.time ?? ""
      const key = `${ex.date}|${firstTime}`
      list.push({ key, label: `${ex.date}${firstTime ? ` · ${firstTime}` : ""}` })
    }
    return list
  }, [form])

  const canSelect = mode === "SELECT_FROM_PARENT" || mode === "SELECT_FROM_EVENT"

  return (
    <Section title={label}>
      {canSelect && derivedOccurrences.length > 0 && (
        <>
          {/* If you already have a checkbox list component, use it. Otherwise, simplest: SelectBlock is not ideal for multi-select. */}
          <SelectBlock
            form={form}
            name={"pieceScheduleMode" as Path<EventFormData>}
            label="Are your times listed in the parent event?"
            required
            options={[
              { label: "Yes — I'll select from the event schedule", value: "FROM_PARENT" },
              { label: "No — I'll add custom date/time", value: "CUSTOM" },
            ]}
          />

          {/* For now: a lightweight way to "select occurrences" without building a full checkbox UI */}
          {/* TODO: Replace this with a CheckboxGroup component */}
          <SelectBlock
            form={form}
            name={"selectedSlots" as Path<EventFormData>}
            label="Select one occurrence (temporary)"
            required
            multiple
            options={derivedOccurrences.map((o) => ({ label: o.label, value: o.key }))}
          />
        </>
      )}

      {/* If no selectable occurrences, or user indicates missing times, show the custom editor */}
      <DateTimeList
        form={form as unknown as UseFormReturn<Record<string, unknown>>}
        title="Add your piece date(s) & time(s)"
        name="extraOccurrences"
        required
      />
    </Section>
  )
}
