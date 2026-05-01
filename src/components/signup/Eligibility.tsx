"use client"

import { UseFormReturn } from "react-hook-form"
import { Section } from "@/components/forms/blocks/Section"
import { SignupFormData } from "@/lib/validations/signup"
import { SelectBlock } from "../forms/blocks/Select"

interface SignUpEligibilityProps {
  form: UseFormReturn<SignupFormData>
}

export function SignUpEligibility({ form }: SignUpEligibilityProps) {
  const profileType = form.watch("profile_type")
  const isOrg = profileType === "company" || profileType === "festival" || profileType === "other"
  const subj = isOrg ? "your organization" : "you"
  const title = isOrg ? "Eligibility" : "Emerging artist eligibility"

  return (
    <Section title={title}>
      <SelectBlock
        form={form}
        name="self_identifies_emerging"
        label={
          isOrg
            ? `Does ${subj} identify with the Emerging Artist program?`
            : "Do you identify as an Emerging Artist?"
        }
        required
        options={[
          { label: "Yes", value: "true" },
          { label: "No", value: "false" },
        ]}
      />

      <SelectBlock
        form={form}
        name="operating_budget_range"
        label="Operating budget"
        allowOther={true}
        otherName="operating_budget_other_text"
        required
        options={[
          { label: "$0 - $24,999", value: "r_0_24999" },
          { label: "$25,000 - $49,999", value: "r_25000_49999" },
          { label: "$50,000 - $99,999", value: "r_50000_99999" },
          { label: "$100,000 - $499,999", value: "r_100000_499999" },
          { label: "$500,000 - $999,999", value: "r_500000_999999" },
          { label: "$1,000,000 - $1,999,999", value: "r_1000000_1999999" },
          { label: "$2,000,000 +", value: "r_2000000_plus" },
        ]}
      />

      <SelectBlock
        form={form}
        name="owns_or_operates_venue"
        allowOther={true}
        otherName="owns_or_operates_venue_other_text"
        required
        label={
          isOrg
            ? `Does ${subj} currently own or operate a dedicated venue or studio space?`
            : "Do you currently own or operate a dedicated venue or studio space?"
        }
        options={[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ]}
      />

      <SelectBlock
        form={form}
        name="supported_by_major_institution"
        allowOther={true}
        otherName="supported_by_major_institution_other_text"
        required
        label={
          isOrg
            ? `Is ${subj} being presented or supported by a major institution (e.g. The Joyce Theater, 92nd Street Y, BAM)?`
            : "Are you being presented or supported by a major institution (e.g. The Joyce Theater, 92nd Street Y, BAM, etc.)?"
        }
        options={[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ]}
      />

      <SelectBlock
        form={form}
        name="classes_hosted_independently"
        allowOther={true}
        otherName="classes_hosted_independently_other_text"
        required
        label={
          isOrg
            ? `If offering classes or workshops, are they hosted independently of a larger organization (e.g. Gibney, Peridance, Broadway Dance Center)?`
            : "If offering classes or workshops, are they hosted independently of a larger organization (e.g. Gibney, Peridance, Broadway Dance Center, etc.)?"
        }
        options={[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ]}
      />

      <SelectBlock
        form={form}
        name="has_501c3"
        allowOther={true}
        otherName="has_501c3_other_text"
        required
        label={isOrg ? `Does ${subj} have 501(c)(3) status?` : "Do you have your 501(c)(3) status?"}
        options={[
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ]}
      />
    </Section>
  )
}
