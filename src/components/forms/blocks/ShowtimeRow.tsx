/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useLayoutEffect, forwardRef } from "react"
import { UseFormReturn, FieldValues, useFieldArray, Path, useWatch } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { LocationFieldInstructions } from "./LocationField"
import { LocationSection } from "./LocationSection"
import { isOnlineLocationMode } from "@/lib/location/mode"
import type { LocationConfigFull } from "./DateTime/types"
import { focusFormFieldNoScroll } from "@/lib/forms/focus-field"

function getTodayDateString(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function shouldShowFieldError(
  form: UseFormReturn<any>,
  fieldName: string,
  errorMode: "touched" | "always",
) {
  const state = form.getFieldState(fieldName as any, form.formState)
  if (!state?.error) return false
  if (errorMode === "always") return true
  // Inline actions (e.g. “+ Add another time”) use setError(..., { type: "manual" }) — show immediately.
  if (state.error.type === "manual") return true
  return (
    state.isTouched ||
    form.formState.isSubmitted ||
    form.formState.submitCount > 0
  )
}

function getErrorMessage(form: UseFormReturn<any>, fieldName: string) {
  const state = form.getFieldState(fieldName as any, form.formState)
  return state?.error?.message as string | undefined
}

export interface ShowtimeRowProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: string
  index: number
  showTime: boolean
  errorMode: "touched" | "always"
  labelIndex: number
  /** When omitted, the row is date / time only (e.g. deadlines, auditions). */
  locationConfig?: LocationConfigFull
  /** Per-card heading prefix (e.g. "Showtime", "Class date", "Deadline"). */
  rowLabel?: string
  /** When false, heading is only `rowLabel` (e.g. single-slot lists with `maxDates={1}`). */
  showLabelIndex?: boolean
  onRemove: (index: number) => void
  canRemove: boolean
  maxTimesPerDate?: number
  dateInputId: string
  /** When true, shows an end-time field per time slot (e.g. class/workshop). Default false. */
  showEndTime?: boolean
}

export const ShowtimeRow = forwardRef<HTMLDivElement, ShowtimeRowProps<any>>(
  function ShowtimeRow(
    {
      form,
      name,
      index,
      showTime,
      errorMode,
      labelIndex,
      locationConfig,
      rowLabel = "Date & Time",
      showLabelIndex = true,
      onRemove,
      canRemove,
      maxTimesPerDate,
      dateInputId,
      showEndTime = false,
    },
    ref,
  ) {
    const { control, register, getValues, setError } = form
    // Subscribe to validation + touch state so field errors update after Zod / setError (same pattern as LocationField).
    void form.formState.errors
    void form.formState.touchedFields
    void form.formState.isSubmitted
    void form.formState.submitCount

    const { fields: times, append: appendTime, remove: removeTime } = useFieldArray({
      control,
      name: `${name}.${index}.times` as any,
    })
    const dateFieldName = `${name}.${index}.date`

    const showDateErr = shouldShowFieldError(form, dateFieldName, errorMode)
    const dateErrMsg = showDateErr ? getErrorMessage(form, dateFieldName) : undefined

    const canAddTime = showTime && (!maxTimesPerDate || times.length < maxTimesPerDate)

    const handleAddTime = () => {
      if (!showTime) return
      if (maxTimesPerDate && times.length >= maxTimesPerDate) return

      const date = getValues(dateFieldName as any) as string | undefined
      if (!String(date ?? "").trim()) {
        setError(dateFieldName as any, { type: "manual", message: "Date is required" })
        focusFormFieldNoScroll(form, dateFieldName, { shouldSelect: true })
        return
      }

      const lastIdx = times.length - 1
      const lastTime =
        times.length > 0
          ? ((getValues(`${name}.${index}.times.${lastIdx}.time` as any) as string | undefined) ?? "")
          : ""

      if (times.length > 0 && !String(lastTime).trim()) {
        setError(`${name}.${index}.times.${lastIdx}.time` as any, {
          type: "manual",
          message: "Time is required",
        })
        focusFormFieldNoScroll(form, `${name}.${index}.times.${lastIdx}.time`, { shouldSelect: true })
        return
      }

      appendTime((showEndTime ? { time: "", endTime: "" } : { time: "" }) as any)
    }

    const handleRemoveTime = (timeIndex: number) => {
      removeTime(timeIndex)
    }

    // Ensure a first time row exists when the section shows time fields (RHF v7+ stable `append` ref).
    // Guard with getValues: nested useFieldArray can briefly report length 0 right after the parent
    // row is appended (e.g. ShowtimesList seeding times: [{ time: "" }]), which would duplicate times.
    useLayoutEffect(() => {
      if (!showTime) return
      if (times.length > 0) return
      const path = `${name}.${index}.times` as const
      const raw = getValues(path as any) as unknown
      if (Array.isArray(raw) && raw.length > 0) return
      appendTime((showEndTime ? { time: "", endTime: "" } : { time: "" }) as any)
    }, [showTime, times.length, appendTime, getValues, name, index, showEndTime])

    const firstTimeFieldName = `${name}.${index}.times.0.time`
    const firstEndTimeFieldName = `${name}.${index}.times.0.endTime`
    const showFirstTimeErr = showTime ? shouldShowFieldError(form, firstTimeFieldName, errorMode) : false
    const firstTimeErrMsg = showFirstTimeErr ? getErrorMessage(form, firstTimeFieldName) : undefined
    const showFirstEndErr =
      showTime && showEndTime ? shouldShowFieldError(form, firstEndTimeFieldName, errorMode) : false
    const firstEndErrMsg = showFirstEndErr ? getErrorMessage(form, firstEndTimeFieldName) : undefined

    const hasTime = showTime && times.length > 0
    const hasLocation = Boolean(locationConfig)
    const occurrenceMode = useWatch({
      control: form.control,
      name: `${name}.${index}.${locationConfig?.locationModeName ?? "locationMode"}` as Path<FieldValues>,
    })
    const isOnlineOccurrence = isOnlineLocationMode(occurrenceMode)
    const hasInstructionsField =
      Boolean(locationConfig?.instructionsName) && !isOnlineOccurrence
    const gridColsClass = (() => {
      if (!hasTime && !hasLocation) return "md:grid-cols-1"
      if (!hasTime && hasLocation) return "md:grid-cols-2"
      if (hasTime && !hasLocation) return showEndTime ? "md:grid-cols-3" : "md:grid-cols-2"
      return showEndTime ? "md:grid-cols-4" : "md:grid-cols-3"
    })()

    const locationColStartClass = hasTime
      ? showEndTime
        ? "md:col-start-4"
        : "md:col-start-3"
      : "md:col-start-2"
    const instructionsSpacerSpanClass = hasTime
      ? showEndTime
        ? "md:col-span-3 md:col-start-1 md:row-start-2"
        : "md:col-span-2 md:col-start-1 md:row-start-2"
      : "md:col-start-1 md:row-start-2"
    const instructionsPanelColClass = hasTime
      ? showEndTime
        ? "md:row-start-2 md:col-start-4"
        : "md:row-start-2 md:col-start-3"
      : "md:row-start-2 md:col-start-2"

    return (
      <Card
        ref={ref}
        className="space-y-4 rounded-2xl border border-border-default bg-surface-panel p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-text-primary">
            {showLabelIndex ? `${rowLabel} ${labelIndex}` : rowLabel}
          </h4>
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="shrink-0 rounded-md border border-border-default bg-surface-interactive px-2.5 py-1.5 text-xs font-medium text-text-primary shadow-sm transition-colors hover:border-status-error-fg/40 hover:bg-status-error-bg hover:text-status-error-fg"
            >
              Remove
            </button>
          )}
        </div>

        {/*
          Row 1: date | (time) | place only — address row is isolated from row 2 so
          opening instructions does not move date / time / location.
        */}
        <div className={`grid grid-cols-1 items-start gap-x-4 gap-y-3 ${gridColsClass}`}>
            <div className="w-full min-w-0 sm:max-w-[12.5rem] md:max-w-none">
              <label htmlFor={dateInputId} className="mb-1.5 block text-sm font-medium text-text-primary">
                Date <span className="text-error-600">*</span>
              </label>
              <Input
                id={dateInputId}
                type="date"
                min={getTodayDateString()}
                error={showDateErr}
                className="w-full"
                {...register(dateFieldName as any)}
              />
              {dateErrMsg && <p className="mt-1 text-xs text-red-600">{dateErrMsg}</p>}
            </div>

            {hasTime && (
              <div className="w-full min-w-0 sm:max-w-[9.5rem] md:max-w-none">
                <label className="mb-1.5 block text-sm font-medium text-text-primary" htmlFor={`${dateInputId}-time-0`}>
                  Time <span className="text-error-600">*</span>
                </label>
                <Input
                  id={`${dateInputId}-time-0`}
                  type="time"
                  error={showFirstTimeErr}
                  className="w-full"
                  {...register(firstTimeFieldName as any)}
                />
                {firstTimeErrMsg && <p className="mt-1 text-xs text-red-600">{firstTimeErrMsg}</p>}
              </div>
            )}

            {hasTime && showEndTime && (
              <div className="w-full min-w-0 sm:max-w-[9.5rem] md:max-w-none">
                <label
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                  htmlFor={`${dateInputId}-end-0`}
                >
                  End time
                </label>
                <Input
                  id={`${dateInputId}-end-0`}
                  type="time"
                  error={showFirstEndErr}
                  className="w-full"
                  {...register(firstEndTimeFieldName as any)}
                />
                {firstEndErrMsg && <p className="mt-1 text-xs text-red-600">{firstEndErrMsg}</p>}
              </div>
            )}

            {hasLocation && locationConfig && (
              <>
                <div className={`min-h-0 min-w-0 md:row-start-1 ${locationColStartClass}`}>
                  <LocationSection
                    form={form}
                    modeName={`${name}.${index}.${locationConfig.locationModeName ?? "locationMode"}` as Path<FieldValues>}
                    addressName={`${name}.${index}.${locationConfig.addressName}` as Path<FieldValues>}
                    venueName={locationConfig.venueName ? (`${name}.${index}.${locationConfig.venueName}` as Path<FieldValues>) : undefined}
                    placeIdName={locationConfig.placeIdName ? (`${name}.${index}.${locationConfig.placeIdName}` as Path<FieldValues>) : undefined}
                    latName={locationConfig.latName ? (`${name}.${index}.${locationConfig.latName}` as Path<FieldValues>) : undefined}
                    lngName={locationConfig.lngName ? (`${name}.${index}.${locationConfig.lngName}` as Path<FieldValues>) : undefined}
                    instructionsName={locationConfig.instructionsName ? (`${name}.${index}.${locationConfig.instructionsName}` as Path<FieldValues>) : undefined}
                    includeInstructionsInPlace={false}
                    label={locationConfig.label || "Location"}
                    note={locationConfig.note}
                    required={locationConfig.required ?? true}
                    compact
                    className="w-full"
                    errorMode={errorMode}
                  />
                </div>

                {hasInstructionsField && (
                  <div
                    className={`hidden h-0 overflow-hidden p-0 md:block ${instructionsSpacerSpanClass}`}
                    aria-hidden
                  />
                )}

                {hasInstructionsField && (
                  <div className={`min-w-0 ${instructionsPanelColClass}`}>
                    <LocationFieldInstructions
                      form={form}
                      instructionsName={
                        `${name}.${index}.${locationConfig.instructionsName}` as Path<FieldValues>
                      }
                      instructionsLabel={locationConfig.instructionsLabel ?? "Location instructions"}
                      instructionsPlaceholder={locationConfig.instructionsPlaceholder}
                      instructionsCollapsible
                      addButtonTightTop
                      errorMode={errorMode}
                    />
                  </div>
                )}
              </>
            )}
        </div>

        {showTime && times.length > 1 && (
          <div className="space-y-3 border-t border-border-default/70 pt-3">
            {times.slice(1).map((timeField, sliceIndex) => {
              const timeIndex = sliceIndex + 1
              const timeFieldName = `${name}.${index}.times.${timeIndex}.time`
              const endTimeFieldName = `${name}.${index}.times.${timeIndex}.endTime`
              const showTimeErr = shouldShowFieldError(form, timeFieldName, errorMode)
              const timeErrMsgLocal = showTimeErr ? getErrorMessage(form, timeFieldName) : undefined
              const showEndErr =
                showEndTime && shouldShowFieldError(form, endTimeFieldName, errorMode)
              const endErrMsgLocal = showEndErr ? getErrorMessage(form, endTimeFieldName) : undefined

              return (
                <div key={timeField.id} className="flex flex-wrap items-end gap-2 sm:gap-3">
                  <div className="min-w-0 sm:max-w-[9.5rem] sm:flex-1">
                    <label
                      className="mb-1.5 block text-sm font-medium text-text-primary"
                      htmlFor={`${dateInputId}-time-${timeIndex}`}
                    >
                      Additional time <span className="text-error-600">*</span>
                    </label>
                    <Input
                      id={`${dateInputId}-time-${timeIndex}`}
                      type="time"
                      error={showTimeErr}
                      className="w-full"
                      {...register(timeFieldName as any)}
                    />
                    {timeErrMsgLocal && <p className="mt-1 text-xs text-red-600">{timeErrMsgLocal}</p>}
                  </div>
                  {showEndTime && (
                    <div className="min-w-0 sm:max-w-[9.5rem] sm:flex-1">
                      <label
                        className="mb-1.5 block text-sm font-medium text-text-primary"
                        htmlFor={`${dateInputId}-end-${timeIndex}`}
                      >
                        End time
                      </label>
                      <Input
                        id={`${dateInputId}-end-${timeIndex}`}
                        type="time"
                        error={showEndErr}
                        className="w-full"
                        {...register(endTimeFieldName as any)}
                      />
                      {endErrMsgLocal && <p className="mt-1 text-xs text-red-600">{endErrMsgLocal}</p>}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveTime(timeIndex)}
                    className="rounded border border-border-default bg-surface-interactive px-2.5 py-2 text-xs text-text-primary hover:bg-surface-interactive-hover"
                  >
                    Remove
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {showTime && canAddTime && (
          <button
            type="button"
            onClick={handleAddTime}
            className="w-full text-left text-sm font-medium text-text-primary hover:underline sm:w-auto"
          >
            + Add another time
          </button>
        )}
      </Card>
    )
  },
)

ShowtimeRow.displayName = "ShowtimeRow"
