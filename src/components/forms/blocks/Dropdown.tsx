"use client"

import { UseFormReturn, useFormState } from "react-hook-form"
import { Select } from "@/components/ui/select"
import { Caption, Label } from "@/components/ui/typography"
import { FormFieldTooltip } from "@/components/forms/blocks/FormFieldTooltip"
import { stack } from "@/lib/spacing"
import { cn } from "@/lib/utils"

type Option = {
  value: string
  label?: string
  disabled?: boolean
}

interface DropdownProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  name: string
  label?: string
  /** Hover tooltip beside the label (info icon). */
  labelTooltip?: string
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
  labelTooltip,
  options,
  placeholder,
  required = false,
  showAsterisk = true,
  errorMode = "touched",
  className,
}: DropdownProps<T>) {
  useFormState({ control: form.control, name: name as never, exact: true })
  const state = form.getFieldState(name as unknown as never, form.formState)
  const showError =
    Boolean(state.error) &&
    (errorMode === "always" ||
      state.isTouched ||
      form.formState.isSubmitted ||
      form.formState.submitCount > 0)

  return (
    <div className={cn(stack.sm, className)}>
      {label && (
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <Label className="text-text-primary">
            {label} {required && showAsterisk && <span className="text-error-600">*</span>}
          </Label>
          {labelTooltip?.trim() ? <FormFieldTooltip text={labelTooltip.trim()} /> : null}
        </div>
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
        <Caption className="text-error-600">{String(state.error.message)}</Caption>
      )}
    </div>
  )
}