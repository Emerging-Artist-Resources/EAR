import { UseFormReturn, useFormState } from "react-hook-form"
import { Textarea } from "@/components/ui/textarea"
import { Caption, Label, Muted } from "@/components/ui/typography"
import { stack } from "@/lib/spacing"
import { cn } from "@/lib/utils"

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
  /** Merged into the inner `Textarea` (e.g. `bg-white` on light cards). */
  inputClassName?: string
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
  inputClassName,
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
    <div className={cn(stack.sm, className)}>
      <div className={stack.xs}>
        <Label>
          {label} {required && showAsterisk && <span className="text-error-600">*</span>}
        </Label>
        {note && <Muted className="whitespace-pre-line">{note}</Muted>}
      </div>
      <Textarea
        {...register(name as unknown as never)}
        rows={rows}
        placeholder={placeholder}
        className={cn(inputClassName)}
      />
      {showError && state.error?.message && (
        <Caption className="text-error-600">{state.error.message}</Caption>
      )}
    </div>
  )
}
