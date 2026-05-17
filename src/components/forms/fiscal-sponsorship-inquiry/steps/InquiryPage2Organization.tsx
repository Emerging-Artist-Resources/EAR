"use client"

import { useFormContext } from "react-hook-form"
import { SelectBlock } from "@/components/forms/blocks/Select"
import { TextAreaField } from "@/components/forms/blocks/TextAreaField"
import { InquiryFieldStep } from "@/components/forms/fiscal-sponsorship-inquiry/steps/InquiryFieldStep"
import { inquiryLayoutSpacing } from "@/components/forms/service-inquiry/inquiry-layout-spacing"
import { fiscalSponsorshipInquiryPages } from "@/lib/service-inquiries/fiscal-sponsorship-form-config"
import {
  ARTISTIC_DISCIPLINE_OPTIONS,
  ENTITY_TYPE_OPTIONS,
  toSelectOptions,
} from "@/lib/service-inquiries/fiscal-sponsorship-options"
import type { FiscalSponsorshipInquiryFormData } from "@/lib/validations/fiscal-sponsorship-inquiry"

const meta = fiscalSponsorshipInquiryPages[1]

export function InquiryPage2Organization() {
  const form = useFormContext<FiscalSponsorshipInquiryFormData>()

  return (
    <InquiryFieldStep title={meta.title} description={meta.description}>
      <div className={inquiryLayoutSpacing.cardInner}>
        <SelectBlock
          form={form}
          name="entityType"
          label="What type of entity are you?"
          required
          allowOther
          otherName="entityTypeOther"
          options={toSelectOptions(ENTITY_TYPE_OPTIONS)}
          errorMode="always"
        />
        <SelectBlock
          form={form}
          name="artisticDiscipline"
          label="Artistic Discipline"
          required
          multiple
          allowOther
          otherName="artisticDisciplineOther"
          options={toSelectOptions(ARTISTIC_DISCIPLINE_OPTIONS)}
          errorMode="always"
        />
        <TextAreaField
          form={form}
          name="projectDescription"
          label="Please describe your project or organization"
          required={false}
          showAsterisk={false}
          rows={5}
          errorMode="always"
        />
      </div>
    </InquiryFieldStep>
  )
}
