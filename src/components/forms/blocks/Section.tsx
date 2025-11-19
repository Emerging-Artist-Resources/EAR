import React from "react"
import { H3, Text } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

export interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
}

export const Section: React.FC<SectionProps> = ({ title, description, className, children, ...props }) => {
  return (
    <section className={cn("space-y-3", className)} {...props}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <H3 className="text-gray-900">{title}</H3>}
          {description && <Text className="text-gray-600">{description}</Text>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  )
}


