"use client"

import { useFormContext } from "react-hook-form"
import { SelectBlock } from "@/components/forms/blocks/Select"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { TextField } from "@/components/forms/blocks/TextField"
import { InquiryFieldStep } from "@/components/forms/fiscal-sponsorship-inquiry/steps/InquiryFieldStep"
import { fiscalSponsorshipInquiryPages } from "@/lib/service-inquiries/fiscal-sponsorship-form-config"
import {
  ADDITIONAL_SERVICES_INTEREST_OPTIONS,
  ANNUAL_BUDGET_OPTIONS,
  EXPECTED_SERVICES_OPTIONS,
  HOW_HEARD_OPTIONS,
  LEGAL_ENTITY_OPTIONS,
  toSelectOptions,
  WHY_SEEKING_OPTIONS,
  YES_NO_OPTIONS,
} from "@/lib/service-inquiries/fiscal-sponsorship-options"
import type { FiscalSponsorshipInquiryFormData } from "@/lib/validations/fiscal-sponsorship-inquiry"

const meta = fiscalSponsorshipInquiryPages[2]

export function InquiryPage3Sponsorship() {
  const form = useFormContext<FiscalSponsorshipInquiryFormData>()
  const previousFiscalSponsor = form.watch("previousFiscalSponsor")

  return (
    <InquiryFieldStep title={meta.title} description={meta.description}>
      <div className="space-y-10">
        <section className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">Budget & goals</h3>
          <SelectBlock
            form={form}
            name="annualBudget"
            label="What is your estimated annual project budget?"
            required
            options={toSelectOptions(ANNUAL_BUDGET_OPTIONS)}
            errorMode="always"
          />
          <SelectBlock
            form={form}
            name="whySeeking"
            label="Why are you seeking fiscal sponsorship?"
            required
            multiple
            allowOther
            otherName="whySeekingOther"
            options={toSelectOptions(WHY_SEEKING_OPTIONS)}
            errorMode="always"
          />
          <SelectBlock
            form={form}
            name="expectedServices"
            label="Which services would you expect from a fiscal sponsor?"
            required
            multiple
            allowOther
            otherName="expectedServicesOther"
            options={toSelectOptions(EXPECTED_SERVICES_OPTIONS)}
            errorMode="always"
          />
        </section>

        <section className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">Legal & history</h3>
          <SelectBlock
            form={form}
            name="legalEntity"
            label="Do you currently have a legal entity?"
            required
            allowOther
            otherName="legalEntityOther"
            options={toSelectOptions(LEGAL_ENTITY_OPTIONS)}
            errorMode="always"
          />
          <SelectBlock
            form={form}
            name="previousFiscalSponsor"
            label="Have you previously worked with a fiscal sponsor?"
            required
            options={toSelectOptions(YES_NO_OPTIONS)}
            errorMode="always"
          />
          {previousFiscalSponsor === "Yes" ? (
            <TextField
              form={form}
              name="previousFiscalSponsorOrg"
              label="If yes, which organization?"
              required
              errorMode="always"
            />
          ) : null}
        </section>

        <section className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">Additional info</h3>
          <SelectBlock
            form={form}
            name="additionalServicesInterest"
            label="Are you interested in additional fiscal services (bookkeeping, grant writing, fiscal mentorship, etc.)?"
            required
            options={toSelectOptions(ADDITIONAL_SERVICES_INTEREST_OPTIONS)}
            errorMode="always"
          />
          <SelectBlock
            form={form}
            name="howHeard"
            label="How did you hear about us?"
            required={false}
            showAsterisk={false}
            allowOther
            otherName="howHeardOther"
            options={toSelectOptions(HOW_HEARD_OPTIONS)}
            errorMode="always"
          />
          <TextAreaField
            form={form}
            name="anythingElse"
            label="Is there anything else you'd like to share about your organization/project?"
            required={false}
            showAsterisk={false}
            rows={5}
            errorMode="always"
          />
        </section>
      </div>
    </InquiryFieldStep>
  )
}
