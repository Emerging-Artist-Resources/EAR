import { FiscalServicesInquiryForm } from "@/components/forms/fiscal-services-inquiry/FiscalServicesInquiryForm"
import { buildPageMetadata } from "@/lib/config/site-metadata"

export const metadata = buildPageMetadata({
  title: "Fiscal Services Inquiry",
  description:
    "Inquire about bookkeeping, fiscal mentorship, and other fiscal services with Emerging Artist Resources.",
  path: "/services/fiscal-services/inquiry",
})

export default function FiscalServicesInquiryPage() {
  return (
    <div className="bg-secondary-50 min-h-[60vh]">
      <FiscalServicesInquiryForm title="Fiscal Services Inquiry" />
    </div>
  )
}
