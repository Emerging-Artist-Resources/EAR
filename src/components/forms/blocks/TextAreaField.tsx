import React from "react"
import { UseFormReturn } from "react-hook-form"
import { Textarea } from "@/components/ui/textarea"

interface TextAreaFieldProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  name: string
  label: string
  placeholder?: string
  rows?: number
  required?: boolean
  className?: string
}

export function TextAreaField<T extends Record<string, unknown>>({
  form,
  name,
  label,
  placeholder,
  rows = 4,
  required,
  className,
}: TextAreaFieldProps<T>) {
  const { register, formState: { errors } } = form
  const err = (errors as unknown as Record<string, unknown>)[name]
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-error-600">*</span>}
      </label>
      <Textarea
        {...register(name as any)}
        rows={rows}
        placeholder={placeholder}
        error={Boolean(err)}
      />
    </div>
  )
}


