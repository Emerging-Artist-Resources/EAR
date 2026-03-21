import { InquiryFieldStep } from "@/components/forms/fiscal-sponsorship-inquiry/steps/InquiryFieldStep"
import { fiscalSponsorshipInquiryFieldSteps } from "@/lib/fiscal-sponsorship-inquiry-content"

const meta = fiscalSponsorshipInquiryFieldSteps[2]

/** Add fields here; use `useFormContext()` and form block components. */
export function InquiryStep4() {
  return <InquiryFieldStep title={meta.title} description={meta.description} />
}
