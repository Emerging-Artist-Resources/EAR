import React from "react"
import { H3, Text } from "@/components/ui/typography"
import { stack } from "@/lib/spacing"
import { cn } from "@/lib/utils"

export interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
}

export const Section: React.FC<SectionProps> = ({ title, description, className, children, ...props }) => {
  return (
    <section className={cn(stack.md, className)} {...props}>
      {(title || description) && (
        <div className={stack.xs}>
          {title && <H3 className="text-text-primary">{title}</H3>}
          {description && <Text className="text-text-muted">{description}</Text>}
        </div>
      )}
      <div className={stack.md}>{children}</div>
    </section>
  )
}
