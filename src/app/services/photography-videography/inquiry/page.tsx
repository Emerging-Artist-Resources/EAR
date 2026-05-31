import type { Metadata } from "next"
import { DocumentationInquiryForm } from "@/components/forms/documentation-inquiry/DocumentationInquiryForm"

export const metadata: Metadata = {
  title: "Photography & Videography inquiry",
  description:
    "Inquire about photography, videography, and combined documentation packages with Emerging Artist Resources.",
}

export default function PhotographyVideographyInquiryPage() {
  return (
    <div className="bg-secondary-50 min-h-[60vh]">
      <DocumentationInquiryForm title="Photography & Videography Inquiry" />
    </div>
  )
}
