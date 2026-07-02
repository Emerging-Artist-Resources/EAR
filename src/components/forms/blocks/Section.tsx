import React from "react"
import { H3, Text } from "@/components/ui/typography"
import { FormFieldTooltip } from "@/components/forms/blocks/FormFieldTooltip"
import { form, stack } from "@/lib/spacing"
import { cn } from "@/lib/utils"

export interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  /** Info icon beside the section title. */
  titleTooltip?: string
  description?: string
}

export const Section: React.FC<SectionProps> = ({
  title,
  titleTooltip,
  description,
  className,
  children,
  ...props
}) => {
  const hasHeader = Boolean(title || description)
  const titleTooltipText = titleTooltip?.trim()

  return (
    <section className={cn(hasHeader ? form.section : form.fields, className)} {...props}>
      {hasHeader && (
        <div className={stack.xs}>
          {title && (
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <H3 className="text-text-primary">{title}</H3>
              {titleTooltipText ? <FormFieldTooltip text={titleTooltipText} /> : null}
            </div>
          )}
          {description && <Text className="text-text-muted">{description}</Text>}
        </div>
      )}
      <div className={form.fields}>{children}</div>
    </section>
  )
}
