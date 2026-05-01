import React from "react"
import { cn } from "@/lib/utils"

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

export const H1 = ({ className, ...props }: TypographyProps) => (
  <h1 className={cn("font-title text-3xl font-bold tracking-tight text-inherit", className)} {...props} />
)

export const H2 = ({ className, ...props }: TypographyProps) => (
  <h2 className={cn("font-header text-2xl font-semibold tracking-tight text-inherit", className)} {...props} />
)

export const H3 = ({ className, ...props }: TypographyProps) => (
  <h3 className={cn("font-header text-2xl font-semibold tracking-tight text-inherit", className)} {...props} />
)

export const H4 = ({ className, ...props }: TypographyProps) => (
  <h4 className={cn("font-header text-2xl font-medium tracking-tight text-inherit", className)} {...props} />
)

export const Text = ({ className, ...props }: TypographyProps) => (
  <p className={cn("font-sans text-base leading-6 text-inherit", className)} {...props} />
)

export const Muted = ({ className, ...props }: TypographyProps) => (
  <p className={cn("text-sm text-inherit opacity-80", className)} {...props} />
)


