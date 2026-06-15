import { DocumentationInquiryForm } from "@/components/forms/documentation-inquiry/DocumentationInquiryForm"
import { buildPageMetadata } from "@/lib/config/site-metadata"

export const metadata = buildPageMetadata({
  title: "Photography & Videography Inquiry",
  description:
    "Inquire about photography, videography, and combined documentation packages with Emerging Artist Resources.",
  path: "/services/photography-videography/inquiry",
})

export default function PhotographyVideographyInquiryPage() {
  return (
    <div className="bg-secondary-50 min-h-[60vh]">
      <DocumentationInquiryForm title="Photography & Videography Inquiry" />
    </div>
  )
}
