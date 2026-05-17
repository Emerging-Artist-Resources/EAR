import { fiscalSponsorshipInquiryContent } from "@/lib/fiscal-sponsorship-inquiry-content"
import { FISCAL_SPONSORSHIP_SERVICE_SLUG } from "@/lib/service-inquiries/fiscal-sponsorship-options"

export { FISCAL_SPONSORSHIP_SERVICE_SLUG }

const inquirySteps = fiscalSponsorshipInquiryContent.steps ?? []

/** Derived from `fiscalSponsorshipInquiryContent.steps` (do not duplicate copy here). */
export const fiscalSponsorshipInquiryPages = inquirySteps.map((step, index) => ({
  page: index + 1,
  title: step.title,
  description: step.description,
})) as ReadonlyArray<{
  page: number
  title: string
  description?: string
}>

export const FISCAL_SPONSORSHIP_INQUIRY_TOTAL_PAGES = fiscalSponsorshipInquiryPages.length

export const fiscalSponsorshipInquiryPage3Sections = [
  {
    title: "Budget & goals",
    fieldNames: ["annualBudget", "whySeeking", "expectedServices"] as const,
  },
  {
    title: "Legal & history",
    fieldNames: [
      "legalEntity",
      "previousFiscalSponsor",
      "previousFiscalSponsorOrg",
    ] as const,
  },
  {
    title: "Additional info",
    fieldNames: [
      "additionalServicesInterest",
      "howHeard",
      "anythingElse",
    ] as const,
  },
] as const
