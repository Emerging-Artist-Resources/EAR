import React from "react"
import { cn } from "@/lib/utils"

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode
}

export const Display = ({ className, ...props }: TypographyProps) => (
  <p
    className={cn(
      "font-title text-4xl font-bold uppercase tracking-wide leading-[1.3] sm:text-5xl lg:text-6xl text-inherit",
      className,
    )}
    {...props}
  />
)

export const H1 = ({ className, ...props }: TypographyProps) => (
  <h1 className={cn("font-title text-h1 font-bold leading-heading tracking-tight text-inherit", className)} {...props} />
)

export const H2 = ({ className, ...props }: TypographyProps) => (
  <h2 className={cn("font-header text-h2 font-semibold leading-heading tracking-tight text-inherit", className)} {...props} />
)

export const H3 = ({ className, ...props }: TypographyProps) => (
  <h3 className={cn("font-header text-h3 font-semibold leading-heading tracking-tight text-inherit", className)} {...props} />
)

export const H4 = ({ className, ...props }: TypographyProps) => (
  <h4 className={cn("font-header text-h4 font-medium leading-heading tracking-tight text-inherit", className)} {...props} />
)

export const Text = ({ className, ...props }: TypographyProps) => (
  <p className={cn("font-sans text-body leading-body text-inherit", className)} {...props} />
)

export const TextSmall = ({ className, ...props }: TypographyProps) => (
  <p className={cn("font-sans text-body-sm leading-body text-inherit", className)} {...props} />
)

export const Muted = ({ className, ...props }: TypographyProps) => (
  <p className={cn("font-sans text-body-sm leading-body text-text-muted", className)} {...props} />
)

export const Label = ({ className, ...props }: LabelProps) => (
  <label className={cn("block font-sans text-body-sm font-medium leading-body text-inherit", className)} {...props} />
)

export const Caption = ({ className, ...props }: TypographyProps) => (
  <p className={cn("font-sans text-caption leading-body text-inherit", className)} {...props} />
)

export const Eyebrow = ({ className, ...props }: TypographyProps) => (
  <p className={cn("font-sans text-body-sm font-semibold uppercase tracking-eyebrow text-inherit", className)} {...props} />
)
