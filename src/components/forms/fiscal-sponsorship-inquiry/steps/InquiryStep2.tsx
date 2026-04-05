"use client"

import { useFormContext } from "react-hook-form"
import { TextField } from "@/components/forms/blocks/TextField"
import { InquiryFieldStep } from "@/components/forms/fiscal-sponsorship-inquiry/steps/InquiryFieldStep"
import { fiscalSponsorshipInquiryFieldSteps } from "@/lib/fiscal-sponsorship-inquiry-content"
import type { FiscalSponsorshipInquiryFormData } from "@/lib/validations/fiscal-sponsorship-inquiry"

const meta = fiscalSponsorshipInquiryFieldSteps[0]

const shortAnswerPlaceholder = "Short answer text"

export function InquiryStep2() {
  const form = useFormContext<FiscalSponsorshipInquiryFormData>()

  return (
    <InquiryFieldStep title={meta.title} description={meta.description}>
      <div className="space-y-6">
        <TextField
          form={form}
          name="firstName"
          label="First Name"
          required
          placeholder={shortAnswerPlaceholder}
          errorMode="always"
        />
        <TextField
          form={form}
          name="lastName"
          label="Last Name"
          required
          placeholder={shortAnswerPlaceholder}
          errorMode="always"
        />
        <TextField
          form={form}
          name="pronouns"
          label="Pronouns"
          required={false}
          showAsterisk={false}
          placeholder={shortAnswerPlaceholder}
          errorMode="always"
        />
        <TextField
          form={form}
          name="email"
          label="Email Address"
          type="email"
          required
          placeholder={shortAnswerPlaceholder}
          errorMode="always"
        />
        <TextField
          form={form}
          name="artistProjectOrOrgName"
          label="Artist, Project, or Organization Name"
          required
          placeholder={shortAnswerPlaceholder}
          errorMode="always"
        />
        <TextField
          form={form}
          name="websiteSocialPortfolio"
          label="Website / Social Media / Portfolio"
          required={false}
          showAsterisk={false}
          placeholder={shortAnswerPlaceholder}
          errorMode="always"
        />
        <TextField
          form={form}
          name="artistLocation"
          label="Where are you based?"
          note="City and State"
          required
          placeholder={shortAnswerPlaceholder}
          errorMode="always"
        />
      </div>
    </InquiryFieldStep>
  )
}