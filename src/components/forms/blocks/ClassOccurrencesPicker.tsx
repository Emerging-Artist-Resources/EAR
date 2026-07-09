"use client"

import { UseFormReturn, Path, useWatch } from "react-hook-form"
import { useMemo, useState, useEffect } from "react"
import { Section } from "@/components/forms/blocks/Section"
import { ShowtimesList } from "@/components/forms/blocks/ShowtimesList"
import { SelectBlock } from "@/components/forms/blocks/Select"
import { Caption, Muted } from "@/components/ui/typography"
import { EventFormData } from "@/lib/validations/events"
import { apiGet } from "@/lib/client/fetch-utils"
import { DEFAULT_LOCATION_MODE } from "@/lib/location/mode"
import { LOCATION_UNDISCLOSED_TOOLTIP } from "@/lib/location/tooltips"
import { formInlineLink, stack } from "@/lib/spacing"
import { cn } from "@/lib/utils"

interface ParentEventData {
  event_occurrences?: Array<{ id: string; starts_at_utc: string; tz: string }>
}

interface ClassOccurrencesPickerProps {
  form: UseFormReturn<EventFormData>
  label: string
  /** Pass through to schedule rows (class/workshop end times). */
  showEndTime?: boolean
}

export function ClassOccurrencesPicker({ form, label, showEndTime = false }: ClassOccurrencesPickerProps) {
  const [useManualEntry, setUseManualEntry] = useState(false)
  const [parentDates, setParentDates] = useState<string[]>([])
  const [loadingParent, setLoadingParent] = useState(false)
  const [parentEventError, setParentEventError] = useState<string | null>(null)

  const parentEventId = useWatch({
    control: form.control,
    name: "parentEventId" as Path<EventFormData>,
  }) as string | undefined

  const ENABLE_SAMPLE_DATA = false // set to true to use sample data for testing
  const sampleParentDates: string[] = [
    "2024-12-15",
    "2024-12-16",
    "2024-12-17",
    "2024-12-18",
    "2024-12-19",
  ]

  const selectedDates = useWatch({
    control: form.control,
    name: "selectedParentDates" as Path<EventFormData>,
    defaultValue: [],
  }) as string[] | undefined

  const hasRealParentDates = useMemo(() => {
    return parentDates.length > 0 && !loadingParent && !parentEventError
  }, [parentDates, loadingParent, parentEventError])

  const displayParentDates = useMemo(() => {
    if (ENABLE_SAMPLE_DATA && !hasRealParentDates && !useManualEntry) {
      return sampleParentDates
    }
    return parentDates
  }, [ENABLE_SAMPLE_DATA, hasRealParentDates, useManualEntry, parentDates])

  useEffect(() => {
    if (useManualEntry) {
      setParentDates([])
      setParentEventError(null)
      return
    }

    const parentId = parentEventId?.trim()
    if (!parentId) {
      if (ENABLE_SAMPLE_DATA) {
        setParentDates([])
        setParentEventError(null)
        setLoadingParent(false)
      } else {
        setParentDates([])
        setParentEventError(null)
      }
      return
    }

    const fetchParentEvent = async () => {
      setLoadingParent(true)
      setParentEventError(null)
      try {
        const data = await apiGet<ParentEventData>(`/api/events/${parentId}`)
        if (data?.event_occurrences && data.event_occurrences.length > 0) {
          const uniqueDates = Array.from(
            new Set(
              data.event_occurrences
                .map((occ) => {
                  try {
                    const date = new Date(occ.starts_at_utc)
                    return date.toISOString().split("T")[0]
                  } catch {
                    return null
                  }
                })
                .filter((date): date is string => date !== null)
            )
          ).sort()

          setParentDates(uniqueDates)
        } else {
          setParentDates([])
          if (!ENABLE_SAMPLE_DATA) {
            setParentEventError("Parent event has no dates")
          }
        }
      } catch (error) {
        console.error("Error fetching parent event:", error)
        setParentDates([])
        if (!ENABLE_SAMPLE_DATA) {
          setParentEventError("Could not load parent event dates")
        }
      } finally {
        setLoadingParent(false)
      }
    }

    fetchParentEvent()
  }, [parentEventId, useManualEntry])

  const dateOptions = useMemo(() => {
    return displayParentDates.map((date) => ({
      label: new Date(date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      value: date,
    }))
  }, [displayParentDates])

  const hasParentDates = displayParentDates.length > 0 && !loadingParent && !parentEventError
  const hasSelectedDates = selectedDates && selectedDates.length > 0
  const shouldShowManualEntry = useManualEntry || !hasParentDates

  useEffect(() => {
    if (!hasSelectedDates || useManualEntry) return

    const currentOccurrences = (form.getValues("occurrences" as Path<EventFormData>) ??
      []) as Array<{
      date: string
      times: Array<{ time: string; endTime?: string }>
    }>

    const existingDatesSet = new Set(currentOccurrences.map((occ) => occ.date))
    const datesToAdd = selectedDates?.filter((date) => !existingDatesSet.has(date)) ?? []

    if (datesToAdd.length > 0) {
      const newOccurrences = [
        ...currentOccurrences,
        ...datesToAdd.map((date) => ({
          date,
          times: showEndTime ? [{ time: "", endTime: "" }] : [{ time: "" }],
          locationMode: DEFAULT_LOCATION_MODE,
        })),
      ].sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date))

      form.setValue("occurrences" as Path<EventFormData>, newOccurrences as never)
    }
  }, [selectedDates, form, useManualEntry, hasSelectedDates, showEndTime])

  if (shouldShowManualEntry) {
    return (
      <Section title={label}>
        {hasParentDates && useManualEntry && (
          <button
            type="button"
            onClick={() => setUseManualEntry(false)}
            className={formInlineLink}
          >
            ← Select dates from festival/workshop
          </button>
        )}
        <ShowtimesList
          form={form as unknown as UseFormReturn<Record<string, unknown>>}
          name={"occurrences"}
          title="Class date(s) & time(s)"
          note="Add all dates and times."
          required
          rowLabel="Class date"
          maxTimesPerDate={1}
          showEndTime={showEndTime}
          locationConfig={{
            addressName: "address",
            venueName: "venueName",
            placeIdName: "placeId",
            latName: "lat",
            lngName: "lng",
            instructionsName: "locationInstructions",
            label: "Location",
            labelTooltip: LOCATION_UNDISCLOSED_TOOLTIP,
            required: true,
          }}
        />
      </Section>
    )
  }

  return (
    <Section title={label}>
      {loadingParent && <Muted>Loading festival/workshop dates...</Muted>}

      {parentEventError && (
        <div className={stack.xs}>
          <Caption className="text-error-600">{parentEventError}</Caption>
          <button
            type="button"
            onClick={() => setUseManualEntry(true)}
            className={formInlineLink}
          >
            Enter dates manually instead
          </button>
        </div>
      )}

      {hasParentDates && (
        <>
          <SelectBlock
            form={form}
            name={"selectedParentDates" as Path<EventFormData>}
            label="Select dates from festival/workshop"
            note="Choose the dates when your class will occur, then add times below."
            required
            multiple
            options={dateOptions}
          />

          {hasSelectedDates && (
            <ShowtimesList
              form={form as unknown as UseFormReturn<Record<string, unknown>>}
              name={"occurrences"}
              title="Add times for selected dates"
              note="Add start time(s) for each selected date."
              required
              rowLabel="Class date"
              maxTimesPerDate={1}
              showEndTime={showEndTime}
              locationConfig={{
                addressName: "address",
                venueName: "venueName",
                placeIdName: "placeId",
                latName: "lat",
                lngName: "lng",
                instructionsName: "locationInstructions",
                label: "Location",
                labelTooltip: LOCATION_UNDISCLOSED_TOOLTIP,
                required: true,
              }}
            />
          )}

          <button
            type="button"
            onClick={() => setUseManualEntry(true)}
            className={cn("text-left", formInlineLink)}
          >
            Don&apos;t see your dates? Enter manually instead
          </button>
        </>
      )}
    </Section>
  )
}

