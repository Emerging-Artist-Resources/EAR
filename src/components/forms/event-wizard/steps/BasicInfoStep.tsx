"use client"

import { UseFormReturn, FieldArrayPath, useFieldArray } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { PerformanceFormData } from "@/lib/validations"

interface BasicInfoStepProps {
  form: UseFormReturn<PerformanceFormData>
}

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  const { register, formState: { errors }, control } = form
  const { fields, append, remove } = useFieldArray<PerformanceFormData, FieldArrayPath<PerformanceFormData>, "id">({ control, name: "photoUrls" as FieldArrayPath<PerformanceFormData> })

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 required">Name & Pronouns <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-3">
            <Input {...register('submitterName')} placeholder="Your name" error={!!errors.submitterName} />
            <Input {...register('submitterPronouns')} placeholder="Pronouns" error={!!errors.submitterPronouns} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
          <Input {...register('contactEmail')} type="email" placeholder="you@example.com" error={!!errors.contactEmail} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
          <Input {...register('company')} placeholder="Company / Artist" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company/Artist Website</label>
          <Input {...register('companyWebsite')} placeholder="https://" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Promotional Photos (URLs, up to 5) <span className="text-red-500">*</span></label>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input {...register(`photoUrls.${index}` as const)} placeholder={`https://image${index+1}.jpg`} />
              <Button type="button" variant="outline" onClick={() => remove(index)}>Remove</Button>
            </div>
          ))}
        </div>
        {fields.length < 5 && (
          <div className="mt-2">
            <Button type="button" variant="ghost" onClick={() => append("")}>Add another photo</Button>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Credit Information <span className="text-red-500">*</span></label>
        <Textarea {...register('credits')} rows={3} placeholder="How to display credits" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Social Media Handles <span className="text-red-500">*</span></label>
        <Input {...register('socialHandles')} placeholder="@yourhandle, @company" />
      </div>
    </>
  )
}


