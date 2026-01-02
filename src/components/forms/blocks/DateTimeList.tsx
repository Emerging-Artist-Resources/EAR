/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { UseFormReturn, FieldValues, useFieldArray, useWatch } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Text } from "@/components/ui/typography"

function getTodayDateString(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

type TimeItem = { time: string }
type DateItem = { date: string; times: TimeItem[] }

interface DateTimeListProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>

  /** Field array name: array of { date, times: [{ time }] } */
  name: string

  title?: string
  note?: string
  required?: boolean
  showAsterisk?: boolean

  /** If false, time fields are hidden and optional (date-only mode) */
  showTime?: boolean

  /** Controls error display behavior */
  errorMode?: "touched" | "always"

  /** Start with one blank row if empty */
  startWithOne?: boolean

  /** Caps for single-occurrence mode */
  maxDates?: number
  maxTimesPerDate?: number
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
}

function DateCard<T extends FieldValues>({
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

  // Ensure at least one time row exists when showTime is on
  useEffect(() => {
    if (!showTime) return
    if (times.length > 0) return
    timesArray.append({ time: "" } as any)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTime, index])

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

      {/* Date */}
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

      {/* Times */}
      {showTime && (
        <div className="space-y-2">
          {times.map((timeField, timeIndex) => {
            const timeFieldName = `${name}.${index}.times.${timeIndex}.time`
            const showTimeErr = shouldShowFieldError(form, timeFieldName, errorMode)
            const timeErrMsg = showTimeErr ? getErrorMessage(form, timeFieldName) : undefined

            // Only allow removing non-first rows; also keep at least one row
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
    </Card>
  )
}

export function DateTimeList<T extends Record<string, unknown>>({
  form,
  name,
  title,
  note,
  required = false,
  showAsterisk = true,
  showTime = true,
  errorMode = "touched",
  startWithOne = true,
  maxDates,
  maxTimesPerDate,
}: DateTimeListProps<T>) {
  const { control, getValues, setError, setValue } = form

  const datesArray = useFieldArray({
    control,
    name: name as any,
  })

  const { replace } = datesArray
  const dateFields = datesArray.fields

  // Watch form values to detect external changes (e.g., from setValue in parent)
  const watchedFormValues = useWatch({
    control,
    name: name as any,
  }) as DateItem[] | undefined

  // Sync field array when form values change externally (e.g., when editing confirmed entries)
  // This ensures all entries, including the first one, are properly populated
  const prevFormValuesRef = useRef<string>("")
  const isInitialMountRef = useRef(true)
  const lastSyncLengthRef = useRef<number>(0)
  
  useEffect(() => {
    // On mount, read from getValues() which includes defaults
    // watchedFormValues might be undefined on initial mount
    const formValuesFromGetValues = getValues(name as any) as DateItem[] | undefined
    const currentFormValues = watchedFormValues ?? formValuesFromGetValues ?? []
    
    console.log(`[DateTimeList:${name}] Sync effect running`)
    console.log(`[DateTimeList:${name}] watchedFormValues:`, JSON.stringify(watchedFormValues, null, 2))
    console.log(`[DateTimeList:${name}] formValuesFromGetValues:`, JSON.stringify(formValuesFromGetValues, null, 2))
    console.log(`[DateTimeList:${name}] currentFormValues:`, JSON.stringify(currentFormValues, null, 2))
    console.log(`[DateTimeList:${name}] dateFields.length:`, dateFields.length)
    console.log(`[DateTimeList:${name}] dateFields:`, dateFields.map((f, idx) => ({
      id: f.id,
      date: getValues(`${name}.${idx}.date` as any),
      times: getValues(`${name}.${idx}.times` as any),
    })))
    
    // Normalize form values to ensure consistent structure
    const normalized = currentFormValues.map((d) => ({
      date: d?.date ?? "",
      times: showTime ? (d?.times && d.times.length > 0 ? d.times : [{ time: "" }]) : [],
    }))

    console.log(`[DateTimeList:${name}] normalized:`, JSON.stringify(normalized, null, 2))

    // Create signature to detect changes
    const signature = JSON.stringify(normalized)
    console.log(`[DateTimeList:${name}] signature:`, signature.substring(0, 100))
    console.log(`[DateTimeList:${name}] prevFormValuesRef.current:`, prevFormValuesRef.current.substring(0, 100))
    console.log(`[DateTimeList:${name}] isInitialMountRef.current:`, isInitialMountRef.current)
    
    // On initial mount, if form has values, sync them immediately
    if (isInitialMountRef.current) {
      console.log(`[DateTimeList:${name}] Initial mount - syncing if needed`)
      isInitialMountRef.current = false
      if (normalized.length > 0) {
        // Check if normalized has any complete entries (non-empty dates)
        const hasCompleteEntries = normalized.some(d => d.date && d.date.trim() !== "")
        if (hasCompleteEntries) {
          console.log(`[DateTimeList:${name}] Initial mount with complete values - calling replace`)
          prevFormValuesRef.current = signature
          lastSyncLengthRef.current = normalized.length
          replace(normalized as any)
          
          // Double-check after replace to ensure values persisted
          setTimeout(() => {
            const afterReplaceValues = getValues(name as any) as DateItem[] | undefined
            console.log(`[DateTimeList:${name}] After replace, form.getValues:`, JSON.stringify(afterReplaceValues, null, 2))
            if (!afterReplaceValues || afterReplaceValues.length === 0 || !afterReplaceValues[0]?.date) {
              console.warn(`[DateTimeList:${name}] Values were cleared after replace! Re-applying...`)
              replace(normalized as any)
            }
          }, 100)
          return
        } else {
          console.log(`[DateTimeList:${name}] Initial mount with empty values - will initialize`)
        }
      }
      if (startWithOne && dateFields.length === 0) {
        console.log(`[DateTimeList:${name}] Initial mount empty - appending blank row`)
        // Initialize with blank row if empty
        const initial: DateItem = {
          date: "",
          times: showTime ? [{ time: "" }] : [],
        }
        datesArray.append(initial as any)
      }
      return
    }
    
    // Skip if no change
    if (signature === prevFormValuesRef.current) {
      console.log(`[DateTimeList:${name}] No change detected - skipping sync`)
      return
    }
    
    // Check for length mismatch (definitely external setValue)
    const lengthMismatch = dateFields.length !== normalized.length
    console.log(`[DateTimeList:${name}] lengthMismatch:`, lengthMismatch, `(dateFields: ${dateFields.length}, normalized: ${normalized.length})`)
    
    // Check if form has complete entries (non-empty dates)
    const formHasCompleteEntries = normalized.some(d => d.date && d.date.trim() !== "")
    console.log(`[DateTimeList:${name}] formHasCompleteEntries:`, formHasCompleteEntries)
    
    // More aggressive sync: if form has complete entries and signature changed, sync
    // unless field array length matches AND we can verify the first entry matches (user might be typing)
    // This ensures external setValue always triggers sync, while user typing is preserved
    const firstEntryFieldDate = dateFields.length > 0 ? (getValues(`${name}.0.date` as any) as string | undefined ?? "") : ""
    const firstEntryFormDate = normalized.length > 0 ? (normalized[0]?.date ?? "") : ""
    const firstEntryMatches = dateFields.length > 0 && normalized.length > 0 && firstEntryFieldDate === firstEntryFormDate
    console.log(`[DateTimeList:${name}] firstEntryMatches:`, firstEntryMatches, `(field: "${firstEntryFieldDate}", form: "${firstEntryFormDate}")`)
    
    // Sync if:
    // 1. Length changed (definitely external)
    // 2. OR form has complete entries and first entry doesn't match (external setValue with different values)
    // 3. OR form has complete entries and field array is empty (restoring after clear)
    const shouldSync = lengthMismatch || 
      (formHasCompleteEntries && !firstEntryMatches) ||
      (formHasCompleteEntries && dateFields.length === 0)
    
    console.log(`[DateTimeList:${name}] shouldSync:`, shouldSync, `(lengthMismatch: ${lengthMismatch}, formHasCompleteEntries: ${formHasCompleteEntries}, !firstEntryMatches: ${!firstEntryMatches}, dateFields.length === 0: ${dateFields.length === 0})`)
    
    if (shouldSync) {
      console.log(`[DateTimeList:${name}] SYNCING - calling replace with:`, JSON.stringify(normalized, null, 2))
      prevFormValuesRef.current = signature
      lastSyncLengthRef.current = normalized.length
      replace(normalized as any)
      
      // Log after replace to see if it worked
      setTimeout(() => {
        const afterReplace = dateFields.map((f, idx) => ({
          id: f.id,
          date: getValues(`${name}.${idx}.date` as any),
          times: getValues(`${name}.${idx}.times` as any),
        }))
        console.log(`[DateTimeList:${name}] After replace, dateFields:`, JSON.stringify(afterReplace, null, 2))
      }, 0)
    } else {
      console.log(`[DateTimeList:${name}] NOT syncing - updating ref only`)
      // Update ref to track current state, but don't replace (user is typing)
      prevFormValuesRef.current = signature
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedFormValues, name, showTime, startWithOne, replace, getValues])



  const [syncTimes, setSyncTimes] = useState(false)

  const canAddDate = !maxDates || dateFields.length < maxDates

  const applyFirstTimesToAll = useCallback(() => {
    if (!showTime || !syncTimes) return
    if (dateFields.length < 2) return

    const first = (getValues(`${name}.0.times` as any) as TimeItem[] | undefined) ?? []
    const timesToSync = first.map((t) => t?.time).filter(Boolean) as string[]
    if (timesToSync.length === 0) return

    for (let i = 1; i < dateFields.length; i++) {
      const current = (getValues(`${name}.${i}.times` as any) as TimeItem[] | undefined) ?? []
      const currentList = current.map((t) => t?.time).filter(Boolean)

      if (currentList.join("|") !== timesToSync.join("|")) {
        const capped = maxTimesPerDate ? timesToSync.slice(0, maxTimesPerDate) : timesToSync
        setValue(
          `${name}.${i}.times` as any,
          capped.map((time) => ({ time })) as any,
          { shouldDirty: true },
        )
      }
    }
  }, [dateFields.length, getValues, maxTimesPerDate, name, setValue, showTime, syncTimes])

  const firstTimes = useWatch({
    control,
    name: showTime && syncTimes && dateFields.length > 0 ? (`${name}.0.times` as any) : undefined,
  }) as TimeItem[] | undefined

  // When first date times change and sync is on -> apply to all
  useEffect(() => {
    if (!firstTimes) return
    applyFirstTimesToAll()
  }, [firstTimes, applyFirstTimesToAll])

  const handleAddDate = () => {
    if (maxDates && dateFields.length >= maxDates) return

    const lastIndex = dateFields.length - 1

    if (lastIndex >= 0) {
      const lastDate = (getValues(`${name}.${lastIndex}.date` as any) as string | undefined) ?? ""
      if (!lastDate) {
        setError(`${name}.${lastIndex}.date` as any, {
          type: "required",
          message: "Date is required",
        })
        return
      }

      if (showTime) {
        const lastTimes = (getValues(`${name}.${lastIndex}.times` as any) as TimeItem[] | undefined) ?? []
        const lastTime = lastTimes[lastTimes.length - 1]?.time ?? ""
        if (!lastTime) {
          setError(`${name}.${lastIndex}.times.${Math.max(0, lastTimes.length - 1)}.time` as any, {
            type: "required",
            message: "Time is required",
          })
          return
        }
      }
    }

    datesArray.append({ date: "", times: showTime ? [{ time: "" }] : [] } as any)

    if (syncTimes) {
      requestAnimationFrame(() => applyFirstTimesToAll())
    }
  }

  const headerNote = useMemo(() => {
    if (note) return note
    if (!showTime) return "Add one or more dates."
    if (maxDates === 1 && maxTimesPerDate === 1) return "Add the date and time."
    return "Add one or more times per date, and add multiple dates as needed."
  }, [note, showTime, maxDates, maxTimesPerDate])

  const showSyncToggle =
    showTime &&
    dateFields.length > 1 &&
    (!maxDates || maxDates > 1) &&
    (!maxTimesPerDate || maxTimesPerDate > 0)

  return (
    <div className="space-y-3">
      {title && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {title} {required && showAsterisk && <span className="text-error-600">*</span>}
          </label>
          <p className="mt-1 text-sm text-gray-600">{headerNote}</p>
        </div>
      )}

      {showSyncToggle && (
        <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-3">
          <Checkbox
            id={`${name}-sync-times`}
            checked={syncTimes}
            onChange={(e) => {
              const checked = (e.target as any).checked
              setSyncTimes(checked)
              if (checked) requestAnimationFrame(() => applyFirstTimesToAll())
            }}
          />
          <label htmlFor={`${name}-sync-times`} className="cursor-pointer text-sm font-medium text-gray-700">
            Same times for all dates
          </label>
          {syncTimes && (
            <Text className="ml-2 text-xs text-gray-500">
              Times from the first date will be applied to all dates
            </Text>
          )}
        </div>
      )}

      <div className="space-y-4">
        {dateFields.map((field, index) => (
          <DateCard
            key={field.id}
            form={form as any}
            name={name}
            index={index}
            removeDate={datesArray.remove}
            showTime={showTime}
            errorMode={errorMode}
            disableRemove={index === 0 || (maxDates === 1)}
            isFirst={index === 0}
            maxTimesPerDate={maxTimesPerDate}
            onFirstDateTimesChange={() => {
              if (syncTimes) applyFirstTimesToAll()
            }}
          />
        ))}
      </div>

      {canAddDate && (
        <button
          type="button"
          onClick={handleAddDate}
          className="mt-1 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          + Add another date
        </button>
      )}
    </div>
  )
}
