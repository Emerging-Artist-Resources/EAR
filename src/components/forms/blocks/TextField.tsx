import React from "react"
import { UseFormReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"

interface TextFieldProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  name: string
  label: string
  placeholder?: string
  type?: string
  required?: boolean
  showAsterisk?: boolean
  errorMode?: "touched" | "always"
  prefix?: React.ReactNode
  className?: string
}

export function TextField<T extends Record<string, unknown>>({
  form,
  name,
  label,
  placeholder,
  type = "text",
  required,
  showAsterisk = true,
  errorMode = "touched",
  prefix,
  className,
}: TextFieldProps<T>) {
  const { register } = form
  const state = form.getFieldState(name as unknown as never)
  const showError = Boolean(state.error) && (errorMode === "always" || state.isTouched || form.formState.isSubmitted || form.formState.submitCount > 0)
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && showAsterisk && <span className="text-error-600">*</span>}
      </label>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">{prefix}</span>}
        <Input
          {...register(name as unknown as never)}
          type={type}
          placeholder={placeholder}
          error={showError}
          className={prefix ? "pl-7" : undefined}
        />
      </div>
    </div>
  )
}