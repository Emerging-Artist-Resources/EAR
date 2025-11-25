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
  showAsterisk?: boolean
  errorMode?: "touched" | "always"
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
  showAsterisk = true,
  errorMode = "touched",
}: LocationFieldProps<T>) {
  const { register } = form
  const addrState = form.getFieldState(addressName as unknown as never)
  const instrState = instructionsName ? form.getFieldState(instructionsName as unknown as never) : undefined
  const showAddrError = Boolean(addrState.error) && (errorMode === "always" || addrState.isTouched || form.formState.isSubmitted || form.formState.submitCount > 0)
  const showInstrError = Boolean(instrState?.error) && (errorMode === "always" || instrState?.isTouched || form.formState.isSubmitted || form.formState.submitCount > 0)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && showAsterisk && <span className="text-error-600">*</span>}
        </label>
        <Input {...register(addressName as unknown as never)} placeholder="Enter address" error={showAddrError} />
      </div>
      {instructionsName && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{instructionsLabel}</label>
          <Input {...register(instructionsName as unknown as never)} placeholder="Details to help attendees find the location" error={showInstrError} />
        </div>
      )}
    </div>  
  )
}