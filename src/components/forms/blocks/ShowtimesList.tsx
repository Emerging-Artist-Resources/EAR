/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react"
import { UseFormReturn, useFieldArray, useWatch, FieldValues } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  hasPerOccurrenceLocation,
  isOrganizerOccurrenceRowComplete,
  ORGANIZER_OCCURRENCE_USER_MESSAGES,
} from "@/lib/validations/events/occurrence-row"
import { createLocationFields, type DateItem, type LocationConfigFull } from "./DateTime"
import { isOnlineLocationMode } from "@/lib/location/mode"
import { ShowtimeRow } from "./ShowtimeRow"
import { FormFieldTooltip } from "./FormFieldTooltip"
import { buildEmptyShowtimeRow } from "@/lib/datetime/showtimes-empty-row"
import { focusFormFieldNoScroll } from "@/lib/forms/focus-field"

export interface ShowtimesListProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: string
  title?: string
  note?: string
  /** When set, shows an info control beside the title; default intro copy is omitted (pass `note` to show both). */
  titleTooltip?: string
  required?: boolean
  showAsterisk?: boolean
  showTime?: boolean
  errorMode?: "touched" | "always"
  /** Cap number of rows (e.g. `1` for a single audition or deadline slot). */
  maxDates?: number
  maxTimesPerDate?: number
  /** When omitted, rows are date / time only; location is collected elsewhere or not used. */
  locationConfig?: LocationConfigFull
  /**
   * Label for each row card heading. Numbered as `{rowLabel} 1`, … when more than one slot is allowed (`maxDates` ≠ 1).
   * Examples: "Showtime", "Class date", "Deadline", "Piece date".
   */
  rowLabel?: string
  /** Placed after the intro note (and section title) and before the date/time cards. */
  betweenNoteAndRows?: ReactNode
  /** When true, each slot can include an end time (class/workshop). Default false. */
  showEndTime?: boolean
}

function buildNewShowtimeFromPrevious(
  prev: Record<string, any> | undefined,
  showTime: boolean,
  locationConfig: LocationConfigFull | undefined,
  showEndTime: boolean,
): DateItem {
  const times = prev?.times
  let timeValue = ""
  let endTimeValue = ""
  if (showTime && Array.isArray(times) && times.length === 1) {
    timeValue = (times[0] as { time?: string })?.time ?? ""
    endTimeValue = (times[0] as { endTime?: string })?.endTime ?? ""
  }
  const loc = createLocationFields(locationConfig, prev as Partial<DateItem>)
  const slot =
    showTime && showEndTime
      ? { time: timeValue, endTime: endTimeValue }
      : showTime
        ? { time: timeValue }
        : null
  return {
    date: "",
    times: slot ? [slot] : [],
    ...loc,
  } as DateItem
}

export function ShowtimesList<T extends FieldValues>({
  form,
  name,
  title,
  note,
  titleTooltip,
  required = false,
  showAsterisk = true,
  showTime = true,
  errorMode = "touched",
  maxDates,
  maxTimesPerDate,
  locationConfig,
  rowLabel = "Showtime",
  betweenNoteAndRows,
  showEndTime = false,
}: ShowtimesListProps<T>) {
  const { control, getValues, setError } = form
  const rowElsRef = useRef<(HTMLDivElement | null)[]>([])
  const focusNewRowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { fields, append, remove } = useFieldArray({
    control,
    name: name as any,
  })

  const watchedOccurrences = (useWatch({
    control: control as any,
    name: name as any,
    defaultValue: [],
  }) ?? []) as Record<string, unknown>[]

  const requireLocation = Boolean(locationConfig)

  const canAddShowtime = useMemo(() => {
    if (maxDates !== undefined && fields.length >= maxDates) return false
    if (fields.length === 0) return true
    const lastIdx = fields.length - 1
    const last = watchedOccurrences[lastIdx] as Record<string, unknown> | undefined
    return isOrganizerOccurrenceRowComplete(last, { requireTime: showTime, requireLocation })
  }, [fields.length, maxDates, requireLocation, showTime, watchedOccurrences])

  const defaultHeaderNote = !showTime
    ? "Add one or more dates."
    : requireLocation
      ? "Add one or more showtimes. New rows start with a blank date and copy the previous showtime’s time and location. You can add more than one time on the same date when needed."
      : "Add one or more date & time slots. New rows copy the previous slot’s time."

  const tooltipText = titleTooltip?.trim()
  const hasTitleTooltip = Boolean(tooltipText)

  const headerNote =
    note !== undefined && note !== ""
      ? note
      : hasTitleTooltip
        ? undefined
        : defaultHeaderNote

  // Seed first row before paint so scroll/focus resets are not beaten by a post-mount append.
  useLayoutEffect(() => {
    const rows = (getValues(name as any) as unknown[] | undefined) ?? []
    if (rows.length > 0) return
    append(buildEmptyShowtimeRow({ showTime, showEndTime, locationConfig }) as any)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAddShowtime = useCallback(() => {
    const lastIndex = fields.length - 1
    const basePrev = lastIndex >= 0 ? (`${name}.${lastIndex}` as const) : null
    const prev =
      lastIndex >= 0
        ? (getValues(`${name}.${lastIndex}` as any) as Record<string, any> | undefined)
        : undefined

    if (basePrev && prev) {
      if (!isOrganizerOccurrenceRowComplete(prev, { requireTime: showTime, requireLocation })) {
        if (!String(prev?.date ?? "").trim()) {
          setError(`${basePrev}.date` as any, {
            type: "manual",
            message: ORGANIZER_OCCURRENCE_USER_MESSAGES.addAnotherNeedDate,
          })
          focusFormFieldNoScroll(form, `${basePrev}.date`, { shouldSelect: true })
          return
        }
        if (showTime && Array.isArray(prev.times)) {
          const emptyTimeIdx = prev.times.findIndex((t: { time?: string }) => !String(t?.time ?? "").trim())
          if (emptyTimeIdx >= 0) {
            setError(`${name}.${lastIndex}.times.${emptyTimeIdx}.time` as any, {
              type: "manual",
              message: ORGANIZER_OCCURRENCE_USER_MESSAGES.addAnotherNeedTime,
            })
            focusFormFieldNoScroll(form, `${name}.${lastIndex}.times.${emptyTimeIdx}.time`, {
              shouldSelect: true,
            })
            return
          }
        }
        if (requireLocation && locationConfig && !hasPerOccurrenceLocation(prev)) {
          const modeKey = locationConfig.locationModeName ?? "locationMode"
          const online = isOnlineLocationMode((prev as Record<string, unknown>)[modeKey])
          const errPath = (
            online && locationConfig.instructionsName
              ? `${basePrev}.${locationConfig.instructionsName}`
              : `${basePrev}.${locationConfig.addressName}`
          ) as any
          setError(errPath, {
            type: "manual",
            message: online
              ? ORGANIZER_OCCURRENCE_USER_MESSAGES.addAnotherNeedOnlineDetails
              : ORGANIZER_OCCURRENCE_USER_MESSAGES.addAnotherNeedLocation,
          })
          focusFormFieldNoScroll(form, errPath)
          return
        }
      }
    }

    const newIndex = fields.length
    const row = buildNewShowtimeFromPrevious(prev, showTime, locationConfig, showEndTime)
    append(row as any)
    const datePath = `${name}.${newIndex}.date` as any

    // Defer to after the new row mounts so focus lands on the new date field.
    if (focusNewRowTimeoutRef.current) clearTimeout(focusNewRowTimeoutRef.current)
    focusNewRowTimeoutRef.current = setTimeout(() => {
      focusNewRowTimeoutRef.current = null
      focusFormFieldNoScroll(form, datePath, { shouldSelect: true })
    }, 0)
  }, [append, fields.length, form, getValues, locationConfig, name, requireLocation, setError, showTime, showEndTime])

  useEffect(
    () => () => {
      if (focusNewRowTimeoutRef.current) clearTimeout(focusNewRowTimeoutRef.current)
    },
    [],
  )

  return (
    <div className="space-y-4">
      {title && (
        <header className="space-y-1 border-b border-border-default/70 pb-3">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <label className="text-base font-semibold tracking-tight text-gray-900">
              {title}
              {required && showAsterisk ? <span className="text-error-600"> *</span> : null}
            </label>
            {hasTitleTooltip && tooltipText ? <FormFieldTooltip text={tooltipText} /> : null}
          </div>
          {headerNote ? <p className="text-sm leading-snug text-gray-600">{headerNote}</p> : null}
        </header>
      )}

      {betweenNoteAndRows}

      <div className="space-y-3">
        {fields.map((field, index) => {
          const dateInputId = `${String(name).replace(/[^a-zA-Z0-9-_]/g, "-")}-showtime-date-${index}`
          return (
            <ShowtimeRow
              key={field.id}
              ref={(el) => {
                rowElsRef.current[index] = el
              }}
              form={form}
              name={name}
              index={index}
              showTime={showTime}
              errorMode={errorMode as "touched" | "always"}
              labelIndex={index + 1}
              locationConfig={locationConfig}
              onRemove={remove}
              canRemove={fields.length > 1 && maxDates !== 1}
              maxTimesPerDate={maxTimesPerDate}
              dateInputId={dateInputId}
              rowLabel={rowLabel}
              showLabelIndex={maxDates !== 1}
              showEndTime={showEndTime}
            />
          )
        })}
      </div>

      {maxDates !== 1 && (
        <div>
          <Button
            type="button"
            variant="none"
            className="w-full border-dashed sm:w-auto bg-ear-orange text-ear-off-white hover:bg-ear-orange hover:text-ear-off-white/80"
            onClick={handleAddShowtime}
            disabled={!canAddShowtime}
            title={
              !canAddShowtime
                ? requireLocation
                  ? "Add a date, time, and location to the showtime above before adding another"
                  : "Add a date and time to the slot above before adding another"
                : undefined
            }
          >
            + Add another date
          </Button>
          {/* {!canAddShowtime && (
            <p className="text-xs text-amber-800" role="status">
              {requireLocation
                ? "Add a date, a time, and a location to the showtime above before you add another."
                : "Add a date and a time to the slot above before you add another."}
            </p>
          )} */}
          {/* <p className="text-xs text-gray-500">
            <span className="font-medium text-gray-600">Tip: </span>
            {requireLocation
              ? "New showtimes copy from the one above: location always; time only when that showtime has a single time. The date is left blank to fill in."
              : "New rows copy the previous slot’s time when it has a single time. The date is left blank to fill in."}
          </p> */}
        </div>
      )}
    </div>
  )
}
