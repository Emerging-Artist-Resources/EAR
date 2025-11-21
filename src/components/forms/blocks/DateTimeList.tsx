/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react"
import { useFieldArray, UseFormReturn, FieldValues } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface DateTimeListProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  // used only for variant="simple"
  primaryDateName?: string
  primaryTimeName?: string

  // for variant="extras": array of { date: string; times: { time: string }[] }
  extrasName?: string

  title?: string
  variant?: "simple" | "extras"
  required?: boolean
  showAsterisk?: boolean
  errorMode?: "touched" | "always"
}

// -------- DateCard for extras variant --------

interface DateCardProps<T extends FieldValues> {
  form: UseFormReturn<T>
  extrasName: string
  index: number
  removeDate: (index: number) => void
}

function DateCard<T extends FieldValues>({
  form,
  extrasName,
  index,
  removeDate,
}: DateCardProps<T>) {
  const {
    register,
    control,
    getValues,
    setError,
    formState: { errors },
  } = form

  const {
    fields: timeFields,
    append: appendTime,
    remove: removeTime,
  } = useFieldArray({
    control,
    name: `${extrasName}.${index}.times` as any,
  })

  const dateState = form.getFieldState(`${extrasName}.${index}.date` as any)
  const dateError = dateState.error
  const showDateErr = Boolean(dateError) && (dateState.isTouched || form.formState.isSubmitted || form.formState.submitCount > 0)

  // For times, we still read error messages from formState.errors, but show only after touched/submit
  const timesErrors =
    (((errors as any)?.[extrasName]?.[index]?.times as unknown) as Array<{ time?: { message?: string } }>) ?? []

  const handleAddTime = () => {
    const date = getValues(`${extrasName}.${index}.date` as any) as
      | string
      | undefined
    const lastTime =
      (getValues(
        `${extrasName}.${index}.times.${timeFields.length - 1}.time` as any,
      ) as string | undefined) ?? ""

    if (!date) {
      setError(`${extrasName}.${index}.date` as any, {
        type: "required",
        message: "Date is required",
      })
      return
    }

    if (!lastTime) {
      setError(
        `${extrasName}.${index}.times.${timeFields.length - 1}.time` as any,
        {
          type: "required",
          message: "Time is required",
        },
      )
      return
    }

    appendTime({ time: "" } as any)
  }

  return (
    <Card className="space-y-3 rounded-2xl border border-primary-200 bg-primary-50/40 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Date {index + 1}</h4>
        {index > 0 && (
          <button
            type="button"
            onClick={() => removeDate(index)}
            className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
          >
            Remove date
          </button>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Date *
        </label>
        <Input
          type="date"
          {...register(`${extrasName}.${index}.date` as any)}
          error={showDateErr}
        />
        {showDateErr && dateError?.message && (
          <p className="mt-1 text-xs text-red-600">{dateError?.message}</p>
        )}
      </div>

      {/* Times */}
      <div className="space-y-2">
        {timeFields.map((timeField, timeIndex) => {
          const timeState = form.getFieldState(`${extrasName}.${index}.times.${timeIndex}.time` as any)
          const timeError = timesErrors?.[timeIndex]?.time
          const showTimeErr = Boolean(timeError) && (timeState.isTouched || form.formState.isSubmitted || form.formState.submitCount > 0)
          return (
            <div
              key={timeField.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Time *
                </label>
                <Input
                  type="time"
                  {...register(
                    `${extrasName}.${index}.times.${timeIndex}.time` as any,
                  )}
                  error={showTimeErr}
                />
                {showTimeErr && timeError?.message && (
                  <p className="mt-1 text-xs text-red-600">
                    {timeError.message}
                  </p>
                )}
              </div>
              {timeIndex > 0 && (
                <button
                  type="button"
                  onClick={() => removeTime(timeIndex)}
                  className="w-full rounded border border-gray-300 px-2 py-2 text-xs hover:bg-gray-50"
                >
                  Remove
                </button>
              )}
            </div>
          )
        })}

        <button
          type="button"
          onClick={handleAddTime}
          className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50"
        >
          + Add another time
        </button>
      </div>
    </Card>
  )
}

// -------- Main component --------

export function DateTimeList<T extends Record<string, unknown>>({
  form,
  primaryDateName,
  primaryTimeName,
  extrasName,
  title,
  variant = "simple",
  required = false,
  showAsterisk = true,
  errorMode = "touched",
}: DateTimeListProps<T>) {
  const { control, register, getValues, setError } = form
  // Prepare a stable fieldArray hook to satisfy hooks rules; it’s only used for `extras` variant.
  const fieldArray = useFieldArray({
    control,
    name: (extrasName ?? "__unused") as any,
  })

  // SIMPLE: just one date + time
  if (variant === "simple") {
    const dateState = primaryDateName ? form.getFieldState(primaryDateName as any) : undefined
    const timeState = primaryTimeName ? form.getFieldState(primaryTimeName as any) : undefined
    const showDateErr = Boolean(dateState?.error) && (errorMode === "always" || dateState?.isTouched || form.formState.isSubmitted || form.formState.submitCount > 0)
    const showTimeErr = Boolean(timeState?.error) && (errorMode === "always" || timeState?.isTouched || form.formState.isSubmitted || form.formState.submitCount > 0)

    return (
      <div className="space-y-2">
        {title && (
          <label className="block text-sm font-medium text-gray-700">
            {title} {required && showAsterisk && <span className="text-error-600">*</span>}
          </label>
        )}
        <Card className="space-y-3 rounded-2xl border border-primary-200 bg-primary-50/40 p-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Date *
            </label>
            <Input
              {...register(primaryDateName as any)}
              type="date"
              error={showDateErr}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Time *
            </label>
            <Input
              {...register(primaryTimeName as any)}
              type="time"
              error={showTimeErr}
            />
          </div>
        </Card>
      </div>
    )
  }

  // EXTRAS: card per date, each with N times
  if (!extrasName) {
    console.warn("DateTimeList extras variant requires extrasName")
    return null
  }

  const dateFields = fieldArray.fields
  const appendDate = fieldArray.append
  const removeDate = fieldArray.remove

  const handleAddDate = () => {
    const lastIndex = dateFields.length - 1

    if (lastIndex >= 0) {
      const lastDate = getValues(
        `${extrasName}.${lastIndex}.date` as any,
      ) as string | undefined
      const lastTimes =
        (getValues(`${extrasName}.${lastIndex}.times` as any) as
          | { time: string }[]
          | undefined) ?? []
      const lastTime = lastTimes[lastTimes.length - 1]?.time ?? ""

      if (!lastDate) {
        setError(`${extrasName}.${lastIndex}.date` as any, {
          type: "required",
          message: "Date is required",
        })
        return
      }

      if (!lastTime) {
        setError(
          `${extrasName}.${lastIndex}.times.${lastTimes.length - 1}.time` as any,
          {
            type: "required",
            message: "Time is required",
          },
        )
        return
      }
    }

    // start new date card with one empty time
    appendDate({ date: "", times: [{ time: "" }] } as any)
  }

  return (
    <div className="space-y-3">
      {title && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {title} {required && showAsterisk && <span className="text-error-600">*</span>}
          </label>
          <p className="text-sm text-gray-600">
            You can add multiple times for each date and add multiple dates for
            your show.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {dateFields.map((field, index) => (
          <DateCard
            key={field.id}
            form={form}
            extrasName={extrasName}
            index={index}
            removeDate={removeDate}
          />
        ))}
      </div>

      <div>
        <button
          type="button"
          onClick={handleAddDate}
          className="mt-1 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          + Add another Date
        </button>
      </div>
    </div>
  )
}
