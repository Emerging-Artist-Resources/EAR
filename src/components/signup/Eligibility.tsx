"use client"

import { UseFormReturn } from "react-hook-form"
import { Section } from "@/components/forms/blocks/Section"
import { EventFormData } from "@/lib/validations/events"
import { SelectBlock } from "../forms/blocks/Select"

interface SignUpEligibilityProps {
    form: UseFormReturn<EventFormData>
}

export function SignUpEligibility({ form }: SignUpEligibilityProps) {
    return (
        <Section title="Emerging Artist Eligibility">
            
            <SelectBlock form={form} name="emergingArtistIdentification" label="Do you identify as an Emerging Artist?" required options={[
                { label: "Yes", value: "YES" }, 
                { label: "No", value: "NO" }]} />

            <SelectBlock form={form} name="operatingBudget" label="Operating Budget" allowOther={true} otherName="OTHER_BUDGET" required options={[
                { label: "$0 - $24,999", value: "TIER_1" },
                { label: "$25,000 - $49,999", value: "TEIR_2" },
                { label: "$50,000 - $99,999", value: "TIER_3" },
                { label: "$100,000 - $499,999", value: "TIER_4" },
                { label: "$500,000 - $999,999", value: "TIER_5" },
                { label: "$1,000,000 - $199,999,999", value: "TIER_6" },
                { label: "$2,000,000 +", value: "TIER_7" },
                ]} />

            <SelectBlock form={form} name="physicalSpace" allowOther={true} otherName="OTHER_SPACE" required
                label="Do you currently own or operate a dedicated venue or studio space?" 
                options={[
                { label: "Yes", value: "YES" }, 
                { label: "No", value: "NO" }]} />

            <SelectBlock form={form} name="affiliation" allowOther={true} otherName="OTHER_AFFILIATION" required
                label="Are you being presented or supported by a major institution (e.g, The Joyce Theater, 92nd Street Y, BAM, etc.)?" 
                options={[
                { label: "Yes", value: "YES" }, 
                { label: "No", value: "NO" }]} />

            <SelectBlock form={form} name="instruction" allowOther={true} otherName="OTHER_INSTRUCTION" required
                label="If offering classes or workshops, are they hosted independently of a larger organization (e.g, Gibney, Peridance, Broadway Dance Center, etc.)?" 
                options={[
                { label: "Yes", value: "YES" }, 
                { label: "No", value: "NO" }]} />

            <SelectBlock form={form} name="status_501c3" allowOther={true} otherName="OTHER_STATUS" required label="Do you have your 501c3 status?" options={[
                { label: "Yes", value: "YES" }, 
                { label: "No", value: "NO" }]} />
        </Section>
    )
}