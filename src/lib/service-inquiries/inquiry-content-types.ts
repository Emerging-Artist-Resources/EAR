import type { ReactNode } from "react"

export type ServiceInquiryContent = {
  /** Form chrome; layout defaults to "Inquiry form" */
  formTitle?: string
  /**
   * Wizard step titles/descriptions for multi-step inquiry forms.
   * Source of truth for step copy — derive page config from here (see fiscal sponsorship).
   */
  steps?: ReadonlyArray<{ title: string; description?: string }>

  successTitle: string
  successDescription: string
  responseTime?: string
  contactLabel?: string
  contactEmail?: string
  nextSteps?: ReadonlyArray<string>
  submitAnotherLabel?: string
  successCta?: { label: string; href: string }
  successIcon?: ReactNode
}
