"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { UseFormReturn, type FieldErrors } from "react-hook-form"
import { EventFormData } from "@/lib/validations/events"

type OpportunitySubtype = 'FUNDING' | 'AUDITION' | 'CREATIVE'

interface OpportunityStepProps {
  subtype: OpportunitySubtype
  form: UseFormReturn<EventFormData>
}

export function OpportunityStep({ subtype, form }: OpportunityStepProps) {
  const { register, formState: { errors } } = form
  const e = errors as FieldErrors<EventFormData>
  return (
    <div className="space-y-4">
      {subtype === 'AUDITION' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audition Name *</label>
            <Input {...register('auditionName' as keyof EventFormData)} placeholder="Audition title" error={Boolean(e.auditionName)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">About the Company/Project *</label>
            <Textarea {...register('aboutProject' as keyof EventFormData)} rows={4} placeholder="Mission, choreographer, style" error={Boolean(e.aboutProject)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Who You’re Looking For *</label>
            <Textarea {...register('eligibility' as keyof EventFormData)} rows={3} placeholder="Eligibility, age, style" error={Boolean(e.eligibility)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Compensation *</label>
            <Input {...register('compensation' as keyof EventFormData)} placeholder="e.g., stipend, hourly, unpaid" error={Boolean(e.compensation)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audition Date *</label>
              <Input {...register('auditionDate' as keyof EventFormData)} type="date" error={Boolean(e.auditionDate)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audition Time *</label>
              <Input {...register('auditionTime' as keyof EventFormData)} type="time" error={Boolean(e.auditionTime)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link to Sign Up *</label>
            <Input {...register('auditionLink' as keyof EventFormData)} placeholder="https://" error={Boolean(e.auditionLink)} />
          </div>
        </>
      )}

      {subtype === 'CREATIVE' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opportunity Name *</label>
            <Input {...register('opportunityName' as keyof EventFormData)} placeholder="Title" error={Boolean(e.opportunityName)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brief Description (max 200 words) *</label>
            <Textarea {...register('briefDescription' as keyof EventFormData)} rows={4} placeholder="Description" error={Boolean(e.briefDescription)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Who Can Apply / Eligibility *</label>
              <Textarea {...register('creativeEligibility' as keyof EventFormData)} rows={3} placeholder="Eligibility" error={Boolean(e.creativeEligibility)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What’s Offered *</label>
              <Textarea {...register('whatsOffered' as keyof EventFormData)} rows={3} placeholder="What selected artists receive" error={Boolean(e.whatsOffered)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compensation / Stipend Amount *</label>
              <Input {...register('stipendAmount' as keyof EventFormData)} placeholder="$ or description" error={Boolean(e.stipendAmount)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Application Requirements *</label>
              <Textarea {...register('requirements' as keyof EventFormData)} rows={3} placeholder="Files, statements, etc." error={Boolean(e.requirements)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline *</label>
              <Input {...register('deadline' as keyof EventFormData)} type="datetime-local" error={Boolean(e.deadline)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link to Apply *</label>
              <Input {...register('applyLink' as keyof EventFormData)} placeholder="https://" error={Boolean(e.applyLink)} />
            </div>
          </div>
        </>
      )}

      {subtype === 'FUNDING' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Funding Link *</label>
            <Input {...register('fundingLink' as keyof EventFormData)} placeholder="https://" error={Boolean(e.fundingLink)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <Input {...register('fundingTitle' as keyof EventFormData)} placeholder="Optional title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
            <Textarea {...register('fundingSummary' as keyof EventFormData)} rows={3} placeholder="Brief summary" />
          </div>
        </>
      )}
    </div>
  )
}


