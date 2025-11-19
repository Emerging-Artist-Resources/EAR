import React from "react"
import { UseFormReturn, useFieldArray } from "react-hook-form"
import { Input } from "@/components/ui/input"

interface DateTimeListProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  primaryDateName: string
  primaryTimeName: string
  extrasName: string // array of { date, time }
  title?: string
}

export function DateTimeList<T extends Record<string, unknown>>({
  form,
  primaryDateName,
  primaryTimeName,
  extrasName,
  title,
}: DateTimeListProps<T>) {
  const { control, register, getValues, setError, formState: { errors } } = form
  const { fields, append, remove } = useFieldArray({ control, name: extrasName as any })

  const addExtra = () => {
    const d = getValues(primaryDateName as any) as unknown as string | undefined
    const t = getValues(primaryTimeName as any) as unknown as string | undefined
    if (!d || !t) {
      if (!d) setError(primaryDateName as any, { type: "required", message: "Date is required" })
      if (!t) setError(primaryTimeName as any, { type: "required", message: "Time is required" })
      return
    }
    if (fields.length > 0) {
      const last = getValues(`${extrasName}.${fields.length - 1}` as any) as { date?: string; time?: string }
      if (!last?.date || !last?.time) {
        if (!last?.date) setError(`${extrasName}.${fields.length - 1}.date` as any, { type: "required", message: "Date is required" })
        if (!last?.time) setError(`${extrasName}.${fields.length - 1}.time` as any, { type: "required", message: "Time is required" })
        return
      }
    }
    append({ date: "", time: "" } as any)
  }

  const e = errors as unknown as Record<string, any>

  return (
    <div className="space-y-2">
      {title && <label className="block text-sm font-medium text-gray-700">{title}</label>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <Input {...register(primaryDateName as any)} type="date" error={Boolean(e?.[primaryDateName])} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
          <Input {...register(primaryTimeName as any)} type="time" error={Boolean(e?.[primaryTimeName])} />
        </div>
      </div>
      <div className="mt-2">
        <button type="button" onClick={addExtra} className="text-sm px-2 py-1 rounded border border-gray-300 hover:bg-gray-50">
          Add another date/time
        </button>
      </div>
      <div className="mt-2 space-y-2">
        {fields.map((field, idx) => (
          <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
              <Input {...register(`${extrasName}.${idx}.date` as any)} type="date" error={Boolean(e?.[extrasName]?.[idx]?.date)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Time *</label>
              <Input {...register(`${extrasName}.${idx}.time` as any)} type="time" error={Boolean(e?.[extrasName]?.[idx]?.time)} />
            </div>
            <div>
              <button type="button" onClick={() => remove(idx)} className="text-sm px-2 py-2 rounded border border-gray-300 hover:bg-gray-50 w-full">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}