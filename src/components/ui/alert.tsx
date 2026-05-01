import React from "react"
import { cn } from "@/lib/utils"

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error"
  children: React.ReactNode
}

const alertVariants = {
  default: "bg-surface-panel-alt text-text-primary border-border-default",
  success: "bg-status-success-bg text-status-success-fg border-border-default",
  warning: "bg-status-warning-bg text-status-warning-fg border-border-default",
  error: "bg-status-error-bg text-status-error-fg border-border-default",
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <div
        className={cn(
          "p-4 rounded-md border",
          alertVariants[variant],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Alert.displayName = "Alert"
