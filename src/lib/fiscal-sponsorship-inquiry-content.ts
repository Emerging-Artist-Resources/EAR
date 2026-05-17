import type { ServiceInquiryContent } from "@/lib/service-inquiries/inquiry-content-types"

export const fiscalSponsorshipInquiryContent: ServiceInquiryContent = {
  formTitle: "Fiscal Sponsorship Inquiry",
  /** Wizard step titles/descriptions — source of truth for multi-step copy. */
  steps: [
    {
      title: "Contact information",
      description: "Tell us how to reach you and where you are based.",
    },
    {
      title: "Organization & discipline",
      description: "Share your entity type and artistic focus.",
    },
    {
      title: "Sponsorship needs",
      description: "Help us understand your budget, goals, and history.",
    },
  ],
  successTitle: "Inquiry submitted",
  successDescription:
    "Thank you for reaching out about fiscal sponsorship. Our team will review your inquiry and respond by email.",
  responseTime: "2–5 business days",
  contactLabel: "Questions in the meantime?",
  contactEmail: "info@eararts.org",
}
