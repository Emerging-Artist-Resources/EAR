import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type NewsletterFieldLabelProps = {
  htmlFor: string
  children: ReactNode
  required?: boolean
  className?: string
  size?: "sm" | "md"
}

export function NewsletterFieldLabel({
  htmlFor,
  children,
  required = false,
  className,
  size = "sm",
}: NewsletterFieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "mb-1 block font-medium text-gray-700",
        size === "sm" ? "text-xs" : "text-sm",
        className,
      )}
    >
      {children}
      {required ? <span className="text-error-600"> *</span> : null}
    </label>
  )
}

export function NewsletterRequiredHint({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-gray-500", className)}>
      Fields marked with <span className="text-error-600">*</span> are required.
    </p>
  )
}
