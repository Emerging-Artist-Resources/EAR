import React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error = false, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            // basically shadcn Input base styles
            "flex h-10 w-full rounded-md border bg-card px-3 py-2 text-base text-card-foreground ring-offset-card md:text-sm",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            // select-specific
            "appearance-none pr-8",
            // error state
            error ? "border-destructive focus-visible:ring-destructive" : "border-input",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>

        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    )
  }
)

Select.displayName = "Select"
