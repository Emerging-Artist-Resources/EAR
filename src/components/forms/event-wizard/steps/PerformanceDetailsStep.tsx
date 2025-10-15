"use client"

import { UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PerformanceFormData } from "@/lib/validations"

interface PerformanceDetailsStepProps {
  form: UseFormReturn<PerformanceFormData>
}

export function PerformanceDetailsStep({ form }: PerformanceDetailsStepProps) {
  const { register, formState: { errors } } = form
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Show Name *</label>
        <Input {...register('title')} placeholder="Show title" error={!!errors.title} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Show Date *</label>
          <Input {...register('date')} type="date" error={!!errors.date} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Show Time *</label>
          <Input {...register('showTime')} type="time" error={!!errors.showTime} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Price *</label>
          <Input {...register('ticketPrice')} placeholder="$" error={!!errors.ticketPrice} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Link *</label>
        <Input {...register('ticketLink')} placeholder="https://tickets.example.com" error={!!errors.ticketLink} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Short Description (max 100 words) *</label>
        <Textarea {...register('shortDescription')} rows={4} placeholder="Describe your event" error={!!errors.shortDescription} />
      </div>
    </>
  )
}


