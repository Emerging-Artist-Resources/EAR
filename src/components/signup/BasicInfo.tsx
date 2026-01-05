"use client"

import { UseFormReturn } from "react-hook-form"
import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { SignupFormData } from "@/lib/validations/signup"
import { Dropdown } from "../forms/blocks/Dropdown"
import { LocationField } from "../forms/blocks/LocationField"

interface SignUpBasicInfoProps {
    form: UseFormReturn<SignupFormData>
}

export function SignUpBasicInfo({ form }: SignUpBasicInfoProps) {
    const profileType = form.watch("profile_type")
    const isCompany = profileType === "company"
    const isFestival = profileType === "festival"
    const isOther = profileType === "other"

    return (
        <Section title="Basic Info">
            <Dropdown 
                form={form} 
                name={"profile_type"} 
                label="Profile Type" 
                options={[
                    { label: "Individual", value: "individual" }, 
                    { label: "Company", value: "company" },
                    { label: "Festival/Presenting Organization", value: "festival"},
                    { label: "Other", value: "other" }
                ]} 
                required
            />
            
            <TextField form={form} name={"name"} label="Name" required/>
            <TextField form={form} name={"email"} label="Email" type="email" required/>
            <TextField form={form} name={"pronouns"} label="Pronouns" />
            <TextField form={form} name={"website"} label="Website" type="url" />
            
            {(isCompany || isFestival || isOther) && (
                <TextField form={form} name={"organization_name"} label="Organization Name" />
            )}
            
            <LocationField
                form={form}
                addressName="location_label"
                placeIdName="location_place_id"
                label="Location"
            />
        </Section>
    )
}