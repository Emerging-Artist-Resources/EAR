import React from "react"
import { useForm, UseFormReturn, FieldValues, Path, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"

export interface FormProps<T extends FieldValues> extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  schema: z.ZodSchema<T>
  onSubmit: (data: T) => void | Promise<void>
  defaultValues?: Partial<T>
  children: (form: UseFormReturn<T>) => React.ReactNode
}

export function Form<T extends FieldValues>({
  schema,
  onSubmit,
  defaultValues,
  children,
  className,
  ...props
}: FormProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error("Form submission error:", error)
    }
  })

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-6", className)}
      {...props}
    >
      {children(form)}
    </form>
  )
}

export interface FormFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: Path<T>
  label?: string
  helperText?: string
  children: React.ReactNode
}

export function FormField<T extends FieldValues>({
  form,
  name,
  label,
  helperText,
  children,
}: FormFieldProps<T>) {
  const {
    formState: { errors },
  } = form

  const error = errors[name]?.message as string | undefined

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-error-600">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
}
