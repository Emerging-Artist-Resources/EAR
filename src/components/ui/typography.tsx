import React from "react"
import { cn } from "@/lib/utils"

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

export const H1 = ({ className, ...props }: TypographyProps) => (
  <h1 className={cn("text-3xl font-bold tracking-tight text-gray-900", className)} {...props} />
)

export const H2 = ({ className, ...props }: TypographyProps) => (
  <h2 className={cn("text-2xl font-semibold tracking-tight text-gray-900", className)} {...props} />
)

export const H3 = ({ className, ...props }: TypographyProps) => (
  <h3 className={cn("text-xl font-semibold tracking-tight text-gray-900", className)} {...props} />
)

export const H4 = ({ className, ...props }: TypographyProps) => (
  <h4 className={cn("text-lg font-medium tracking-tight text-gray-900", className)} {...props} />
)

export const Text = ({ className, ...props }: TypographyProps) => (
  <p className={cn("text-sm leading-6 text-gray-700", className)} {...props} />
)

export const Muted = ({ className, ...props }: TypographyProps) => (
  <p className={cn("text-sm text-gray-500", className)} {...props} />
)


