import React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(
          // base shadcn input styles
          "flex w-full rounded-md border bg-card px-3 py-2 text-base text-card-foreground ring-offset-card md:text-sm",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // textarea-specific
          "min-h-[80px] resize-y",
          // error handling
          "border-input",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
          className
        )}
        {...props}
      />
    )
  }
)

Textarea.displayName = "Textarea"
