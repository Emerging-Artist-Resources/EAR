"use client"

import React from "react"
import { UseFormReturn } from "react-hook-form"
import { Select } from "@/components/ui/select"

type Option = {
  value: string
  label?: string
  disabled?: boolean
}

interface DropdownProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  name: string
  label?: string
  options: Option[]
  placeholder?: string
  required?: boolean
  showAsterisk?: boolean
  errorMode?: "touched" | "always"
  className?: string
}

export function Dropdown<T extends Record<string, unknown>>({
  form,
  name,
  label,
  options,
  placeholder,
  required = false,
  showAsterisk = true,
  errorMode = "touched",
  className,
}: DropdownProps<T>) {
  const state = form.getFieldState(name as unknown as never)
  const showError =
    Boolean(state.error) &&
    (errorMode === "always" ||
      state.isTouched ||
      form.formState.isSubmitted ||
      form.formState.submitCount > 0)

  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {label} {required && showAsterisk && <span className="text-error-600">*</span>}
        </label>
      )}
      <Select
        {...form.register(name as unknown as never)}
        error={showError}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label ?? opt.value}
          </option>
        ))}
      </Select>
      {showError && state.error?.message && (
        <p className="mt-1 text-xs text-error-600">{String(state.error.message)}</p>
      )}
    </div>
  )
}


