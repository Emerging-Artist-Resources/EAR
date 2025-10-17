"use client"

import { UseFormReturn, FieldArrayPath, useFieldArray, type FieldErrors } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { EventFormData } from "@/lib/validations/events"

interface BasicInfoStepProps {
  form: UseFormReturn<EventFormData>
}

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  const { register, formState: { errors }, control } = form
  const e = errors as FieldErrors<EventFormData>
  const { fields, append, remove } = useFieldArray<EventFormData, FieldArrayPath<EventFormData>, "id">({ control, name: "photoUrls" as unknown as FieldArrayPath<EventFormData> })

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 required">Name & Pronouns <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-3">
            <Input {...register('submitterName' as keyof EventFormData)} placeholder="Your name" error={Boolean(e.submitterName)} />
            <Input {...register('submitterPronouns' as keyof EventFormData)} placeholder="Pronouns" error={Boolean(e.submitterPronouns)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
          <Input {...register('contactEmail' as keyof EventFormData)} type="email" placeholder="you@example.com" error={Boolean(e.contactEmail)} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Organization or Individual Address <span className="text-red-500">*</span></label>
        <Input {...register('address' as keyof EventFormData)} placeholder="Address" error={Boolean(e.address)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
          <Input {...register('company' as keyof EventFormData)} placeholder="Company / Artist" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company/Artist Website</label>
          <Input {...register('companyWebsite' as keyof EventFormData)} placeholder="https://" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Promotional Photos (URLs, up to 5) <span className="text-red-500">*</span></label>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input
                {...register(`photoUrls.${index}` as unknown as FieldArrayPath<EventFormData>)}
                placeholder={`https://image${index+1}.jpg`}
                error={Boolean((e.photoUrls as Array<unknown> | undefined)?.[index])}
              />
              <Button type="button" variant="outline" onClick={() => remove(index)}>Remove</Button>
            </div>
          ))}
        </div>
        {fields.length < 5 && (
          <div className="mt-2">
            <Button type="button" variant="ghost" onClick={() => append("" as unknown as never)}>Add another photo</Button>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Credit Information <span className="text-red-500">*</span></label>
        <Textarea {...register('credits' as keyof EventFormData)} rows={3} placeholder="How to display credits" error={Boolean(e.credits)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Social Media Handles <span className="text-red-500">*</span></label>
        <Input {...register('socialHandles' as keyof EventFormData)} placeholder="@yourhandle, @company" error={Boolean(e.socialHandles)} />
      </div>
    </>
  )
}


