import type { Metadata } from "next"
import { FiscalSponsorshipInquiryForm } from "@/components/forms/fiscal-sponsorship-inquiry/FiscalSponsorshipInquiryForm"

export const metadata: Metadata = {
  title: "Fiscal sponsorship inquiry",
  description: "Apply or inquire about fiscal sponsorship with Emerging Artist Resources.",
}

export default function FiscalSponsorshipInquiryPage() {
  return (
    <div className="bg-secondary-50 min-h-[60vh]">
      <FiscalSponsorshipInquiryForm />
    </div>
  )
}
