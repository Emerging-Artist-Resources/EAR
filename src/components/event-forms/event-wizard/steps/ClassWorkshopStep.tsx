"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { UseFormReturn, useFieldArray, type FieldErrors } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"

interface ClassWorkshopStepProps {
  form: UseFormReturn<EventFormData>
}

export function ClassWorkshopStep({ form }: ClassWorkshopStepProps) {
  const { register, formState: { errors }, control, getValues, setError } = form
  const e = errors as FieldErrors<EventFormData>
  const { fields, append, remove } = useFieldArray<EventFormData>({ control, name: 'classExtraOccurrences' as unknown as never })

  const handleAdd = () => {
    const d = getValues('classDates' as unknown as keyof EventFormData) as unknown as string | undefined
    const t = getValues('classTimes' as unknown as keyof EventFormData) as unknown as string | undefined
    if (!d || !t) {
      if (!d) setError('classDates' as never, { type: 'required', message: 'Date is required' })
      if (!t) setError('classTimes' as never, { type: 'required', message: 'Time is required' })
      return
    }
    if (fields.length > 0) {
      const last = getValues(`classExtraOccurrences.${fields.length - 1}` as never) as { date?: string; time?: string }
      if (!last?.date || !last?.time) {
        if (!last?.date) setError(`classExtraOccurrences.${fields.length - 1}.date` as never, { type: 'required', message: 'Date is required' })
        if (!last?.time) setError(`classExtraOccurrences.${fields.length - 1}.time` as never, { type: 'required', message: 'Time is required' })
        return
      }
    }
    append({ date: '', time: '' } as never)
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Is this part of a festival? (optional)</label>
          <Input {...register('festivalName')} placeholder="Festival name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Festival Link</label>
          <Input {...register('festivalLink')} placeholder="https://" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Class/Workshop Name *</label>
        <Input {...register('className' as keyof EventFormData)} placeholder="Title" error={Boolean(e.className)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class Date(s) *</label>
          <Input {...register('classDates' as keyof EventFormData)} placeholder="YYYY-MM-DD or range" error={Boolean(e.classDates)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class Time(s) *</label>
          <Input {...register('classTimes' as keyof EventFormData)} placeholder="e.g., 7:00 PM" error={Boolean(e.classTimes)} />
        </div>
      
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class Price(s) *</label>
        <Input {...register('classPrices' as keyof EventFormData)} placeholder="e.g., General $20; Sliding scale $10-$30" error={Boolean(e.classPrices)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class/Workshop Link *</label>
        <Input {...register('classLink' as keyof EventFormData)} placeholder="https://" error={Boolean(e.classLink)} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Class/Workshop Description (max 200 words) *</label>
        <Textarea {...register('classDescription' as keyof EventFormData)} rows={4} placeholder="Description" error={Boolean(e.classDescription)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence (if applicable)</label>
        <Input {...register('classRecurrence' as keyof EventFormData)} placeholder="e.g., Weekly until 2025-12-31" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Credit Information *</label>
        <Textarea {...register('classCreditInfo' as keyof EventFormData)} rows={3} placeholder="Who to list as teacher(s) or org" error={Boolean(e.classCreditInfo)} />
      </div>
    </div>
  )
}


