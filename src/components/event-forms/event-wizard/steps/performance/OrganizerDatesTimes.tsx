"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { useMemo, useRef, useEffect } from "react"
import { EventFormData } from "@/lib/validations/events"
import { Section } from "@/components/forms/blocks/Section"
import { DateTimeList } from "@/components/forms/blocks/DateTimeList"
import { Button } from "@/components/ui/button"

type DateTimeEntry = { date: string; times: Array<{ time: string }> }

function isValidEntry(entry: DateTimeEntry | undefined): boolean {
  if (!entry?.date || !entry.date.trim()) return false
  return entry.times?.some(t => t?.time && t.time.trim() !== "") ?? false
}

function filterValidEntries(entries: DateTimeEntry[]): DateTimeEntry[] {
  return entries.filter(isValidEntry)
}

export function OrganizerDatesTimes({ form }: { form: UseFormReturn<EventFormData> }) {
  // Use useWatch for better reactivity with nested form values
  const extras = (useWatch({
    control: form.control,
    name: "extraOccurrences" as Path<EventFormData>,
    defaultValue: [],
  }) as DateTimeEntry[] | undefined) ?? []
  const isConfirmed = useWatch({
    control: form.control,
    name: "eventDatesConfirmed" as Path<EventFormData>,
  }) as boolean | undefined
  const eventType = useWatch({
    control: form.control,
    name: "event_type" as Path<EventFormData>,
  }) as "SOLO" | "SPLIT_BILL" | "FESTIVAL" | undefined
  
  // For SOLO events, skip confirmation - dates will be saved on submit
  const isSolo = eventType === "SOLO"
  const needsConfirmation = !isSolo // Only SPLIT_BILL and FESTIVAL need confirmation
  
  // Store confirmed entries to preserve them even if form values change during editing
  const confirmedEntriesRef = useRef<DateTimeEntry[]>([])
  const prevConfirmedRef = useRef<boolean | undefined>(isConfirmed)
  // Key to force DateTimeList remount when entering edit mode with correct defaults
  const editKeyRef = useRef(0)
  // Ref to scroll back to section after reset to prevent scroll jump
  const sectionRef = useRef<HTMLDivElement>(null)
  
  // When switching from confirmed to editing, restore the confirmed values to the form
  // This ensures values are restored even if handleEdit timing is off
  useEffect(() => {
    if (prevConfirmedRef.current === true && isConfirmed === false && confirmedEntriesRef.current.length > 0) {
      const currentExtras = (form.getValues("extraOccurrences" as Path<EventFormData>) as DateTimeEntry[] | undefined) ?? []
      const validCurrentEntries = filterValidEntries(currentExtras)
      // Restore values if form is empty or invalid - use setValue() to avoid scroll jump
      if (validCurrentEntries.length === 0 || currentExtras.length !== confirmedEntriesRef.current.length) {
        form.setValue("extraOccurrences" as Path<EventFormData>, confirmedEntriesRef.current as unknown as never, {
          shouldDirty: true,
          shouldTouch: false,
          shouldValidate: false,
        })
        form.setValue("eventDatesConfirmed" as Path<EventFormData>, false as unknown as never, {
          shouldDirty: true,
        })
      }
    }
    prevConfirmedRef.current = isConfirmed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed])
  
  const hasCompleteEntries = useMemo(() => {
    return extras.some(isValidEntry)
  }, [extras])

  const confirmedEntries = useMemo(() => {
    if (isConfirmed && confirmedEntriesRef.current.length > 0) {
      return confirmedEntriesRef.current
    }
    return filterValidEntries(extras)
  }, [extras, isConfirmed])

  const handleConfirm = () => {
    if (hasCompleteEntries) {
      const currentExtras = (form.getValues("extraOccurrences" as Path<EventFormData>) as DateTimeEntry[] | undefined) ?? []
      const valid = filterValidEntries(currentExtras)
      
      confirmedEntriesRef.current = JSON.parse(JSON.stringify(valid))
      form.setValue("extraOccurrences" as Path<EventFormData>, valid as unknown as never, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: false,
      })
      form.setValue("eventDatesConfirmed" as Path<EventFormData>, true as unknown as never, {
        shouldDirty: true,
      })
    }
  }

  const handleEdit = () => {
    if (confirmedEntriesRef.current.length === 0) return

    const scrollY = window.scrollY
    
    const currentFormValues = form.getValues()
    form.reset({
      ...currentFormValues,
      extraOccurrences: confirmedEntriesRef.current,
      eventDatesConfirmed: false,
    } as any, {
      keepDirty: true,
      keepTouched: true,
      keepErrors: false,
    })
    
    form.setValue("extraOccurrences" as Path<EventFormData>, confirmedEntriesRef.current as unknown as never, {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: false,
    })
    
    editKeyRef.current += 1
    
    form.setValue("eventDatesConfirmed" as Path<EventFormData>, false as unknown as never, {
      shouldDirty: true,
    })
    
    requestAnimationFrame(() => {
      if (sectionRef.current) {
        sectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
      } else {
        window.scrollTo(0, scrollY)
      }
    })
  }

  return (
    <div ref={sectionRef}>
      <Section title="Dates & times">
      {!needsConfirmation ? (
        // For SOLO events, always show the DateTimeList directly (no confirmation needed)
        <DateTimeList<EventFormData>
          form={form}
          name={"extraOccurrences"}
          title="Event dates and times"
          required
        />
      ) : (
        // For SPLIT_BILL and FESTIVAL, show confirmation flow
        <>
          {!isConfirmed ? (
            <>
              <DateTimeList<EventFormData>
                key={`edit-${editKeyRef.current}`}
                form={form}
                name={"extraOccurrences"}
                title="Event dates and times"
                required
              />
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={!hasCompleteEntries}
                className="mt-4"
              >
                Confirm dates & times
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Event dates & times confirmed</p>
                {confirmedEntries.length > 0 ? (
                  <ul className="space-y-1 text-sm text-gray-600">
                    {confirmedEntries.map((ex, idx) => {
                      const validTimes = ex.times?.filter(t => t?.time && t.time.trim() !== "").map(t => t.time) || []
                      return (
                        <li key={idx}>
                          {ex.date} · {validTimes.join(", ")}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No dates & times confirmed</p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="mt-3"
                >
                  Edit dates & times
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      </Section>
    </div>
  )
}
