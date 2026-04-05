import type { ReactNode } from "react"
import { Section } from "@/components/forms/blocks/Section"

type InquiryFieldStepProps = {
  title: string
  description?: string
  children?: ReactNode
}

/**
 * Shell for steps 2–6. Add fields with useFormContext() from react-hook-form
 * and your blocks from `@/components/forms/blocks/*`.
 */
export function InquiryFieldStep({ title, description, children }: InquiryFieldStepProps) {
  return (
    <Section title={title} description={description}>
      {children ?? (
        <p className="text-muted-foreground text-sm italic">
          {/* Add TextField, TextAreaField, Select, etc. here */}
        </p>
      )}
    </Section>
  )
}
