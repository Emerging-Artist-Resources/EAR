import React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error" | "primary" | "info"
  size?: "sm" | "md"
  children: React.ReactNode
}

const badgeVariants = {
  default: "bg-surface-interactive text-text-primary border border-border-default",
  success: "bg-status-success-bg text-status-success-fg border border-border-default",
  warning: "bg-status-warning-bg text-status-warning-fg border border-border-default",
  error: "bg-status-error-bg text-status-error-fg border border-border-default",
  primary: "bg-brand-primary text-text-inverse border border-brand-primary",
  info: "bg-brand-secondary text-text-primary border border-border-default",
}

const badgeSizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-sm",
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", size = "md", children, ...props }, ref) => {
    return (
      <div
        className={cn(
          "inline-flex items-center rounded-full font-medium",
          badgeVariants[variant],
          badgeSizes[size],
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

Badge.displayName = "Badge"
