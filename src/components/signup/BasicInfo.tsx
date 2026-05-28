"use client"

import { UseFormReturn } from "react-hook-form"
import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { SignupFormData } from "@/lib/validations/signup"
import { Dropdown } from "../forms/blocks/Dropdown"
import { LocationField } from "../forms/blocks/LocationField"
import { Text } from "@/components/ui/typography"

interface SignUpBasicInfoProps {
  form: UseFormReturn<SignupFormData>
}

export function SignUpBasicInfo({ form }: SignUpBasicInfoProps) {
  const profileType = form.watch("profile_type")
  const isCompany = profileType === "company"
  const isFestival = profileType === "festival"
  const isOther = profileType === "other"
  const isOrg = isCompany || isFestival || isOther

  const orgFields = (
    <>
      <TextField form={form} name={"organization_name"} label="Organization name" />
      <TextField form={form} name={"email"} label="Organization email" type="email" required />
      <TextField form={form} name={"name"} label="Primary contact name" required />
      <TextField
        form={form}
        name={"website"}
        label="Website"
        type="text"
        note="Optional. You can enter example.com — we’ll add https:// for you."
        placeholder="example.com or https://…"
      />
      <LocationField
        form={form}
        addressName="location_label"
        placeIdName="location_place_id"
        label="Address"
      />
    </>
  )

  const individualFields = (
    <>
      <TextField form={form} name={"name"} label="Name" required />
      <TextField form={form} name={"email"} label="Email" type="email" required />
      <TextField form={form} name={"pronouns"} label="Pronouns" />
      <TextField
        form={form}
        name={"website"}
        label="Website"
        type="text"
        note="Optional. You can enter example.com — we’ll add https:// for you."
        placeholder="example.com or https://…"
      />
      <LocationField
        form={form}
        addressName="location_label"
        placeIdName="location_place_id"
        label="Address"
      />
    </>
  )

  return (
    <Section title="Basic Info">
      <Dropdown
        form={form}
        name={"profile_type"}
        label="Profile type"
        options={[
          { label: "Individual", value: "individual" },
          { label: "Company", value: "company" },
          { label: "Festival / presenting organization", value: "festival" },
          { label: "Other", value: "other" },
        ]}
        required
      />

      {isOrg && (
        <Text className="-mt-2 text-sm text-ear-black/70">
          The questions in the next step apply to your organization.
        </Text>
      )}

      {isOrg ? orgFields : individualFields}
    </Section>
  )
}
