import type { Metadata } from "next"
import { FiscalServicesInquiryForm } from "@/components/forms/fiscal-services-inquiry/FiscalServicesInquiryForm"

export const metadata: Metadata = {
  title: "Fiscal services inquiry",
  description:
    "Inquire about bookkeeping, fiscal mentorship, and other fiscal services with Emerging Artist Resources.",
}

export default function FiscalServicesInquiryPage() {
  return (
    <div className="bg-secondary-50 min-h-[60vh]">
      <FiscalServicesInquiryForm title="Fiscal Services Inquiry" />
    </div>
  )
}
