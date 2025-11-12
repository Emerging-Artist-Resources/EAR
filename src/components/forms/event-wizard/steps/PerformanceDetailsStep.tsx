"use client"

import { UseFormReturn, useFieldArray, type FieldErrors } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EventFormData } from "@/lib/validations/events"

interface PerformanceDetailsStepProps {
  form: UseFormReturn<EventFormData>
}

export function PerformanceDetailsStep({ form }: PerformanceDetailsStepProps) {
  const { register, formState: { errors }, control, getValues, setError } = form
  const e = errors as FieldErrors<EventFormData>
  const { fields, append, remove } = useFieldArray<EventFormData>({ control, name: 'extraOccurrences' as unknown as never })

  const handleAddExtra = () => {
    const date = getValues('date' as keyof EventFormData) as unknown as string | undefined
    const time = getValues('showTime' as keyof EventFormData) as unknown as string | undefined
    if (!date || !time) {
      if (!date) setError('date' as never, { type: 'required', message: 'Date is required' })
      if (!time) setError('showTime' as never, { type: 'required', message: 'Time is required' })
      return
    }
    if (fields.length > 0) {
      const last = getValues(`extraOccurrences.${fields.length - 1}` as never) as { date?: string; time?: string }
      if (!last?.date || !last?.time) {
        if (!last?.date) setError(`extraOccurrences.${fields.length - 1}.date` as never, { type: 'required', message: 'Date is required' })
        if (!last?.time) setError(`extraOccurrences.${fields.length - 1}.time` as never, { type: 'required', message: 'Time is required' })
        return
      }
    }
    append({ date: '', time: '' } as never)
  }
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Show Name *</label>
        <Input {...register('title' as never)} placeholder="Show title" error={Boolean(e.title)} />
      </div>

      {/* Primary date/time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Show Date *</label>
          <Input {...register('date' as never)} type="date" error={Boolean(e.date)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Show Time *</label>
          <Input {...register('showTime' as never)} type="time" error={Boolean(e.showTime)} />
        </div>
      </div>

      {/* Add button aligned just under primary date/time */}
      <div className="mt-2">
        <button
          type="button"
          onClick={handleAddExtra}
          className="text-sm px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
        >
          Add another date/time
        </button>
      </div>

      {/* Additional dates/times list */}
      <div className="mt-2 space-y-2">
        {fields.map((field, idx) => (
          <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
              <Input {...register(`extraOccurrences.${idx}.date` as unknown as never)} type="date" error={Boolean((e as unknown as { extraOccurrences?: Array<{ date?: unknown }> })?.extraOccurrences?.[idx]?.date)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Time *</label>
              <Input {...register(`extraOccurrences.${idx}.time` as unknown as never)} type="time" error={Boolean((e as unknown as { extraOccurrences?: Array<{ time?: unknown }> })?.extraOccurrences?.[idx]?.time)} />
            </div>
            <div>
              <button type="button" onClick={() => remove(idx)} className="text-sm px-2 py-2 rounded border border-gray-300 hover:bg-gray-50 w-full">Remove</button>
            </div>
          </div>
        ))}
      </div>

      {/* Ticket price now on its own row after dates/times */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Price *</label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
          <Input
            {...register('ticketPrice' as never)}
            type="number"
            step="0.01"
            inputMode="decimal"
            placeholder="20.00"
            error={Boolean(e.ticketPrice)}
            className="pl-7"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Link *</label>
        <Input {...register('ticketLink' as never)} placeholder="https://tickets.example.com" error={Boolean(e.ticketLink)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Short Description (max 100 words) *</label>
        <Textarea {...register('shortDescription' as never)} rows={4} placeholder="Describe your event" error={Boolean(e.shortDescription)} />
      </div>
    </>
  )
}


