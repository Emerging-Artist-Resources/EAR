import { FiscalSponsorshipInquiryForm } from "@/components/forms/fiscal-sponsorship-inquiry/FiscalSponsorshipInquiryForm"
import { buildPageMetadata } from "@/lib/config/site-metadata"

export const metadata = buildPageMetadata({
  title: "Fiscal Sponsorship Inquiry",
  description: "Apply or inquire about fiscal sponsorship with Emerging Artist Resources.",
  path: "/services/fiscal-sponsorship/inquiry",
})

export default function FiscalSponsorshipInquiryPage() {
  return (
    <div className="bg-secondary-50 min-h-[60vh]">
      <FiscalSponsorshipInquiryForm title="Fiscal Sponsorship Inquiry" />
    </div>
  )
}
