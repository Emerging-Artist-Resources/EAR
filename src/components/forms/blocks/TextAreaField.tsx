import { UseFormReturn, useFormState } from "react-hook-form"
import { Textarea } from "@/components/ui/textarea"

interface TextAreaFieldProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  name: string
  label: string
  note?: string
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
  note,
  placeholder,
  rows = 4,
  required,
  showAsterisk = true,
  errorMode = "touched",
  className,
}: TextAreaFieldProps<T>) {
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
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && showAsterisk && <span className="text-error-600">*</span>}
        </label>
        {note && (
          <p className="mt-1 text-sm text-gray-500">{note}</p>
        )}
      </div>
      <Textarea
        {...register(name as unknown as never)}
        rows={rows}
        placeholder={placeholder}
      />
      {showError && state.error?.message && (
        <p className="mt-1 text-xs text-error-600">
          {state.error.message}
        </p>
      )}
    </div>
  )
}


