import React from "react"
import { UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"

interface LocationFieldProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  addressName: string
  instructionsName?: string
  label?: string
  instructionsLabel?: string
  required?: boolean
}

// NOTE: This is a plain input implementation. Later we can replace the address input
// with Google Places Autocomplete without changing its public interface.
export function LocationField<T extends Record<string, unknown>>({
  form,
  addressName,
  instructionsName,
  label = "Location",
  instructionsLabel = "Additional Instructions",
  required,
}: LocationFieldProps<T>) {
  const { register, formState: { errors } } = form
  const e = errors as unknown as Record<string, any>
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-error-600">*</span>}
        </label>
        <Input {...register(addressName as any)} placeholder="e.g., Studio 5, on 4th Floor" error={Boolean(e?.[addressName])} />
      </div>
      {instructionsName && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{instructionsLabel}</label>
          <Input {...register(instructionsName as any)} placeholder="Details to help attendees find the location" error={Boolean(e?.[instructionsName])} />
        </div>
      )}
    </div>
  )
}


