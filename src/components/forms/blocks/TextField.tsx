import React from "react"
import { UseFormReturn, useFormState } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { FormFieldTooltip } from "@/components/forms/blocks/FormFieldTooltip"

interface TextFieldProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  name: string
  label: string
  /** Accessible help icon beside the label (same text as `aria-label` on the trigger). */
  labelTooltip?: string
  note?: string
  placeholder?: string
  type?: string
  required?: boolean
  showAsterisk?: boolean
  errorMode?: "touched" | "always"
  prefix?: React.ReactNode
  className?: string
  /** Merged into the inner `Input` (e.g. `bg-white` on light cards). */
  inputClassName?: string
}

export function TextField<T extends Record<string, unknown>>({
  form,
  name,
  label,
  labelTooltip,
  note,
  placeholder,
  type = "text",
  required,
  showAsterisk = true,
  errorMode = "touched",
  prefix,
  className,
  inputClassName,
}: TextFieldProps<T>) {
  const { register, control } = form
  useFormState({ control, name: name as never, exact: true })
  const state = form.getFieldState(name as unknown as never, form.formState)
  const showError =
    Boolean(state.error) &&
    (errorMode === "always" ||
      state.isTouched ||
      form.formState.isSubmitted ||
      form.formState.submitCount > 0)
  return (
    <div className={className}>
      <div className="mb-1">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {label} {required && showAsterisk && <span className="text-error-600">*</span>}
          </label>
          {labelTooltip?.trim() ? <FormFieldTooltip text={labelTooltip.trim()} /> : null}
        </div>
        {note && (
          <p className="mt-1 text-sm text-gray-500">{note}</p>
        )}
      </div>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">{prefix}</span>}
        <Input
          {...register(name as unknown as never)}
          type={type}
          placeholder={placeholder}
          required={required}
          aria-required={required ? true : undefined}
          error={showError}
          className={cn(prefix && "pl-7", inputClassName)}
        />
      </div>
      {showError && state.error?.message && (
        <p className="mt-1 text-xs text-error-600">
          {state.error.message}
        </p>
      )}
    </div>
  )
}