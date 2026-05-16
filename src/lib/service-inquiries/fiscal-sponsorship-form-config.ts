import { FISCAL_SPONSORSHIP_SERVICE_SLUG } from "@/lib/service-inquiries/fiscal-sponsorship-options"

export { FISCAL_SPONSORSHIP_SERVICE_SLUG }

export const FISCAL_SPONSORSHIP_INQUIRY_TOTAL_PAGES = 3

export const fiscalSponsorshipInquiryPages = [
  {
    page: 1,
    title: "Contact information",
    description: "Tell us how to reach you and where you are based.",
  },
  {
    page: 2,
    title: "Organization & discipline",
    description: "Share your entity type and artistic focus.",
  },
  {
    page: 3,
    title: "Sponsorship needs",
    description: "Help us understand your budget, goals, and history.",
  },
] as const

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
