/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect } from "react"
import { UseFormReturn, FieldValues, useFieldArray, Path } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { LocationField } from "../LocationField"
import type { LocationConfigFull } from "./types"

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
  const state = form.getFieldState(fieldName as any)
  if (!state?.error) return false
  if (errorMode === "always") return true
  return (
    state.isTouched ||
    form.formState.isSubmitted ||
    form.formState.submitCount > 0
  )
}

function getErrorMessage(form: UseFormReturn<any>, fieldName: string) {
  const state = form.getFieldState(fieldName as any)
  return state?.error?.message as string | undefined
}

interface DateCardProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: string
  index: number
  removeDate: (index: number) => void
  showTime: boolean
  errorMode: "touched" | "always"
  disableRemove?: boolean
  isFirst: boolean
  onFirstDateTimesChange?: () => void
  maxTimesPerDate?: number
  locationConfig?: LocationConfigFull
  syncLocation?: boolean
}

export function DateCard<T extends FieldValues>({
  form,
  name,
  index,
  removeDate,
  showTime,
  errorMode,
  disableRemove,
  isFirst,
  onFirstDateTimesChange,
  maxTimesPerDate,
  locationConfig,
  syncLocation = true,
}: DateCardProps<T>) {
  const { control, register, getValues, setError } = form

  const timesArray = useFieldArray({
    control,
    name: `${name}.${index}.times` as any,
  })

  const times = timesArray.fields
  const dateFieldName = `${name}.${index}.date`

  const showDateErr = shouldShowFieldError(form, dateFieldName, errorMode)
  const dateErrMsg = showDateErr ? getErrorMessage(form, dateFieldName) : undefined

  const canAddTime = showTime && (!maxTimesPerDate || times.length < maxTimesPerDate)

  const handleAddTime = () => {
    if (!showTime) return
    if (maxTimesPerDate && times.length >= maxTimesPerDate) return

    const date = getValues(dateFieldName as any) as string | undefined
    if (!date) {
      setError(dateFieldName as any, { type: "required", message: "Date is required" })
      return
    }

    const lastIdx = times.length - 1
    const lastTime =
      times.length > 0
        ? ((getValues(`${name}.${index}.times.${lastIdx}.time` as any) as string | undefined) ?? "")
        : ""

    if (times.length > 0 && !lastTime) {
      setError(`${name}.${index}.times.${lastIdx}.time` as any, {
        type: "required",
        message: "Time is required",
      })
      return
    }

    timesArray.append({ time: "" } as any)
    if (isFirst) onFirstDateTimesChange?.()
  }

  const handleRemoveTime = (timeIndex: number) => {
    timesArray.remove(timeIndex)
    if (isFirst) onFirstDateTimesChange?.()
  }

  // Only auto-add time if showTime is true and times array is empty
  // This is a safety net - parent DateTimeList should initialize times correctly,
  // but this ensures at least one time input exists if parent doesn't
  useEffect(() => {
    if (!showTime) return
    if (times.length > 0) return
    timesArray.append({ time: "" } as any)
  }, [showTime, times.length, timesArray])

  return (
    <Card className="space-y-3 rounded-2xl border border-primary-200 bg-primary-50/40 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Date {index + 1}</h4>
        {!disableRemove && (
          <button
            type="button"
            onClick={() => removeDate(index)}
            className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
          >
            Remove date
          </button>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Date *</label>
        <Input
          type="date"
          min={getTodayDateString()}
          error={showDateErr}
          {...register(dateFieldName as any)}
        />
        {dateErrMsg && <p className="mt-1 text-xs text-red-600">{dateErrMsg}</p>}
      </div>

      {showTime && (
        <div className="space-y-2">
          {times.map((timeField, timeIndex) => {
            const timeFieldName = `${name}.${index}.times.${timeIndex}.time`
            const showTimeErr = shouldShowFieldError(form, timeFieldName, errorMode)
            const timeErrMsg = showTimeErr ? getErrorMessage(form, timeFieldName) : undefined

            const canRemove = timeIndex > 0

            return (
              <div key={timeField.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {timeIndex === 0 ? "Time *" : "Additional time *"}
                  </label>
                  <Input
                    type="time"
                    error={showTimeErr}
                    {...register(timeFieldName as any, {
                      onChange: () => {
                        if (isFirst) onFirstDateTimesChange?.()
                      },
                    })}
                  />
                  {timeErrMsg && <p className="mt-1 text-xs text-red-600">{timeErrMsg}</p>}
                </div>

                {canRemove ? (
                  <button
                    type="button"
                    onClick={() => handleRemoveTime(timeIndex)}
                    className="w-full rounded border border-gray-300 px-2 py-2 text-xs hover:bg-gray-50"
                  >
                    Remove
                  </button>
                ) : (
                  <div />
                )}
              </div>
            )
          })}

          {canAddTime && (
            <button
              type="button"
              onClick={handleAddTime}
              className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50"
            >
              + Add another time
            </button>
          )}
        </div>
      )}

      {locationConfig && !syncLocation && (
        <div className="mt-3">
          <LocationField
            form={form}
            addressName={`${name}.${index}.${locationConfig.addressName}` as Path<T>}
            venueName={locationConfig.venueName ? `${name}.${index}.${locationConfig.venueName}` as Path<T> : undefined}
            placeIdName={locationConfig.placeIdName ? `${name}.${index}.${locationConfig.placeIdName}` as Path<T> : undefined}
            latName={locationConfig.latName ? `${name}.${index}.${locationConfig.latName}` as Path<T> : undefined}
            lngName={locationConfig.lngName ? `${name}.${index}.${locationConfig.lngName}` as Path<T> : undefined}
            instructionsName={locationConfig.instructionsName ? `${name}.${index}.${locationConfig.instructionsName}` as Path<T> : undefined}
            label={locationConfig.label || "Location"}
            note={locationConfig.note}
            instructionsLabel={locationConfig.instructionsLabel}
            instructionsPlaceholder={locationConfig.instructionsPlaceholder}
            required={locationConfig.required}
          />
        </div>
      )}
    </Card>
  )
}

