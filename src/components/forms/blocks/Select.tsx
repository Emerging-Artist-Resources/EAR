import { Controller, UseFormReturn, useFormState } from "react-hook-form"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"

type Option = {
  value: string
  label?: string
  disabled?: boolean
}

interface SelectBlockProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  name: string
  label?: string
  note?: string
  description?: string // Keep for backward compatibility
  options: Option[]
  multiple?: boolean
  allowOther?: boolean
  otherLabel?: string
  otherName?: string
  otherValue?: string
  required?: boolean
  showAsterisk?: boolean
  errorMode?: "touched" | "always"
  className?: string
}

export function SelectBlock<T extends Record<string, unknown>>({
  form,
  name,
  label,
  note,
  description,
  options,
  multiple = false,
  allowOther = false,
  otherLabel = "Other",
  otherName,
  otherValue = "OTHER",
  required = false,
  showAsterisk = true,
  errorMode = "touched",
  className,
}: SelectBlockProps<T>) {
  const finalOtherName = otherName ?? (`${name}Other`)
  // Group-level state can be added if needed for overall error display
  // Keep computed for future possible group-level error display
  // const showGroupError =
  //   Boolean(groupState.error) &&
  //   (errorMode === "always" || groupState.isTouched || form.formState.isSubmitted || form.formState.submitCount > 0)



    {/* <div
        className={cn(
          "rounded-md border p-3",
          showGroupError ? "border-error-600" : "border-gray-300"
        )}
      > 

      at the end
         {showGroupError && groupState.error?.message && (
        <p className="mt-1 text-xs text-error-600">{String(groupState.error.message)}</p>
      )}
    */}

  useFormState({ control: form.control, name: name as never, exact: true })
  const state = form.getFieldState(name as unknown as never, form.formState)
  const showError =
    Boolean(state.error) &&
    (errorMode === "always" ||
      state.isTouched ||
      form.formState.isSubmitted ||
      form.formState.submitCount > 0)

  return (
    <div className={className}>
      {label && (
        <div className="mb-1">
          <label className="block text-sm font-medium text-text-primary">
            {label} {required && showAsterisk && <span className="text-error-600">*</span>}
          </label>
          {(note || description) && (
            <p className="mt-1 text-sm text-text-muted">{note || description}</p>
          )}
        </div>
      )}    
        <Controller
          control={form.control}
          name={name as unknown as never}
          render={({ field: { value, onChange } }) => {
            const current = value as unknown
            const selectedValues: string[] = Array.isArray(current)
              ? (current as string[])
              : typeof current === "string" && current
              ? [current as string]
              : []

            const isSelected = (v: string) => selectedValues.includes(v)

            const toggle = (v: string) => {
              if (multiple) {
                const next = isSelected(v)
                  ? selectedValues.filter((x) => x !== v)
                  : [...selectedValues, v]
                onChange(next)
              } else {
                onChange(v)
              }
            }

            return (
              <div className="space-y-2">
                {options.map((opt) => (
                  <Card key={opt.value} className="flex items-center gap-2 border-border-default bg-surface-panel p-2 text-sm text-text-primary">
                    {multiple ? (
                      <Checkbox
                        checked={isSelected(opt.value)}
                        onChange={() => toggle(opt.value)}
                        disabled={opt.disabled}
                      />
                    ) : (
                      <input
                        type="radio"
                        name={name}
                        className="h-4 w-4 border-input text-primary focus:ring-ring"
                        checked={isSelected(opt.value)}
                        onChange={() => toggle(opt.value)}
                        disabled={opt.disabled}
                      />
                    )}
                    <span>{opt.label ?? opt.value}</span>
                  </Card>
                ))}

                {allowOther && (() => {
                  const otherState = form.getFieldState(finalOtherName as unknown as never, form.formState)
                  const showOtherErr =
                    Boolean(otherState.error) &&
                    (errorMode === "always" ||
                      otherState.isTouched ||
                      form.formState.isSubmitted ||
                      form.formState.submitCount > 0)
                  const selected = isSelected(otherValue)
                  return (
                    <Card className="flex items-center gap-3 border-border-default bg-surface-panel p-2 text-sm text-text-primary">
                      {multiple ? (
                        <Checkbox
                          checked={selected}
                          onChange={() => toggle(otherValue)}
                        />
                      ) : (
                        <input
                          type="radio"
                          name={name}
                          className="h-4 w-4 border-input text-primary focus:ring-ring"
                          checked={selected}
                          onChange={() => toggle(otherValue)}
                        />
                      )}
                      <span>{otherLabel}:</span>
                      <input
                        {...form.register(finalOtherName as unknown as never)}
                        placeholder=""
                        disabled={!selected}
                        className={`flex-1 bg-transparent outline-none border-0 border-b text-sm ${
                          selected ? "border-border-default focus:border-primary" : "border-border-default"
                        } ${selected ? "focus:ring-0" : "cursor-not-allowed opacity-70"}`}
                      />
                      {selected && showOtherErr && (
                        <span className="ml-2 text-xs text-error-600">{String(otherState.error?.message)}</span>
                      )}
                    </Card>
                  )
                })()}
              </div>
            )
          }}
        />
      {showError && state.error?.message && (
        <p className="mt-1 text-xs text-error-600">
          {state.error.message}
        </p>
      )}
    </div>
  )
}

