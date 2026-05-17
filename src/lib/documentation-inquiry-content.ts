import type { ServiceInquiryContent } from "@/lib/service-inquiries/inquiry-content-types"

export const documentationInquiryContent: ServiceInquiryContent = {
  /** Default title when the page does not pass `title` to DocumentationInquiryForm */
  formTitle: "Inquiry form",
  successTitle: "Inquiry submitted",
  successDescription:
    "Thank you for your photography and videography inquiry. Our team will review your request and follow up by email.",
  responseTime: "3–5 business days",
  contactLabel: "Questions in the meantime?",
  contactEmail: "info@eararts.org",
}
