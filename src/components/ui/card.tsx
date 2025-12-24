import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  // base: shadcn-ish card styling using tokens
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
      },
      border: {
        solid: "border-border",
        none: "border-transparent",
        dashed: "border-dashed border-border",
      },
    },
    defaultVariants: {
      padding: "md",
      border: "solid",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding, border, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ padding, border }), className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = "Card"

// These are already basically shadcn—keeping as-is:
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 pb-4", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardHeader.displayName = "CardHeader"

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn("text-lg font-semibold leading-none tracking-tight", className)}
        {...props}
      >
        {children}
      </h3>
    )
  }
)
CardTitle.displayName = "CardTitle"

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("pt-0", className)} {...props}>
        {children}
      </div>
    )
  }
)
CardContent.displayName = "CardContent"
