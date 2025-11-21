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
  showAsterisk?: boolean
  errorMode?: "touched" | "always"
  className?: string
}

export function TextAreaField<T extends Record<string, unknown>>({
  form,
  name,
  label,
  placeholder,
  rows = 4,
  required,
  showAsterisk = true,
  //errorMode = "touched",
  className,
}: TextAreaFieldProps<T>) {
  const { register } = form
  //const state = form.getFieldState(name as unknown as never)
  //const showError = Boolean(state.error) && (errorMode === "always" || state.isTouched || form.formState.isSubmitted || form.formState.submitCount > 0)
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && showAsterisk && <span className="text-error-600">*</span>}
      </label>
      <Textarea
        {...register(name as unknown as never)}
        rows={rows}
        placeholder={placeholder}
        //error={showError}
      />
    </div>
  )
}


