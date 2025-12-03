"use client"

import { UseFormReturn } from "react-hook-form"
import { Section } from "@/components/forms/blocks/Section"
import { EventFormData } from "@/lib/validations/events"
import { SelectBlock } from "../forms/blocks/Select"

interface SignUpWrapUpProps {
    form: UseFormReturn<EventFormData>
}

export function SignUpWrapUp({ form }: SignUpWrapUpProps) {
    return (
        <Section title="Wrap Up">
            <SelectBlock form={form} name="referralSources" label="Referral Sources" allowOther={true} otherName="OTHER" options={[
                { label: "Instagram", value: "INSTAGRAM" }, 
                { label: "Word of Mouth", value: "WORD_OF_MOUTH" }, 
                { label: "Google", value: "GOOGLE" }]} />

            <SelectBlock form={form} name="newsLetter" label="Would you like to join our newsletter?" description="We'll send you updates about new shows and events." options={[
                { label: "Sign me up for both!", value: "SIGN_ME_UP" },
                { label: "Sign me up for the calendar only", value: "SIGN_ME_UP_CALENDAR" },
                { label: "Sign me up for the newsletter only", value: "SIGN_ME_UP_NEWSLETTER" },
                { label: "No, thanks", value: "NO_THANKS" }]} />
        </Section>
    )
}