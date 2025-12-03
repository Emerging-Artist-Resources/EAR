import React from "react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border-gray-300 text-[var(--primary-600)] focus:ring-[var(--primary-600)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Checkbox.displayName = "Checkbox"


