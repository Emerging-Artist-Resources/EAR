"use client"

import { useFormContext } from "react-hook-form"
import { TextField } from "@/components/forms/blocks/TextField"
import { InquiryFieldStep } from "@/components/forms/fiscal-sponsorship-inquiry/steps/InquiryFieldStep"
import { inquiryLayoutSpacing } from "@/components/forms/service-inquiry/inquiry-layout-spacing"
import { fiscalSponsorshipInquiryPages } from "@/lib/service-inquiries/fiscal-sponsorship-form-config"
import type { FiscalSponsorshipInquiryFormData } from "@/lib/validations/fiscal-sponsorship-inquiry"

const meta = fiscalSponsorshipInquiryPages[0]

export function InquiryPage1Contact() {
  const form = useFormContext<FiscalSponsorshipInquiryFormData>()

  return (
    <InquiryFieldStep title={meta.title} description={meta.description}>
      <div className={inquiryLayoutSpacing.cardInner}>
        <div className={inquiryLayoutSpacing.fieldGrid}>
          <TextField
            form={form}
            name="firstName"
            label="First Name"
            required
            errorMode="always"
          />
          <TextField
            form={form}
            name="lastName"
            label="Last Name"
            required
            errorMode="always"
          />
        </div>
        <TextField
          form={form}
          name="pronouns"
          label="Pronouns"
          required={false}
          showAsterisk={false}
          errorMode="always"
        />
        <TextField
          form={form}
          name="email"
          label="Email Address"
          type="email"
          required
          errorMode="always"
        />
        <TextField
          form={form}
          name="artistProjectOrOrgName"
          label="Artist, Project, or Organization Name"
          required
          errorMode="always"
        />
        <TextField
          form={form}
          name="websiteSocialPortfolio"
          label="Website / Social Media / Portfolio"
          required={false}
          showAsterisk={false}
          errorMode="always"
        />
        <TextField
          form={form}
          name="artistLocation"
          label="Where are you based?"
          note="City & State"
          required
          errorMode="always"
        />
      </div>
    </InquiryFieldStep>
  )
}
