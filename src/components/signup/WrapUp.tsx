"use client"

import { UseFormReturn } from "react-hook-form"
import { Section } from "@/components/forms/blocks/Section"
import { SIGNUP_OTHER_VALUE, SignupFormData } from "@/lib/validations/signup"
import { SelectBlock } from "../forms/blocks/Select"

interface SignUpWrapUpProps {
    form: UseFormReturn<SignupFormData>
}

export function SignUpWrapUp({ form }: SignUpWrapUpProps) {
    return (
        <Section title="Wrap Up">
            <SelectBlock 
                form={form} 
                name="referral_source" 
                label="How did you hear about us?" 
                allowOther={true}
                otherValue={SIGNUP_OTHER_VALUE}
                otherName="referral_source_other"
                required 
                options={[
                    { label: "Instagram", value: "instagram" }, 
                    { label: "Word of Mouth", value: "word_of_mouth" }, 
                    { label: "Google", value: "google" }
                ]} 
            />

            <div className="space-y-4">
                <p className="text-sm font-medium text-ear-black">Newsletter Preferences</p>
                <SelectBlock 
                    form={form} 
                    name="newsletter_ear_opt_in" 
                    label="Would you like to join the EAR newsletter?" 
                    description="We'll send you updates about new shows and events." 
                    required 
                    options={[
                        { label: "Yes", value: "true" }, 
                        { label: "No", value: "false" }
                    ]} 
                />
                <SelectBlock 
                    form={form} 
                    name="newsletter_calendar_opt_in" 
                    label="Would you like to join the calendar newsletter?" 
                    description="We'll send you updates about calendar events." 
                    required 
                    options={[
                        { label: "Yes", value: "true" }, 
                        { label: "No", value: "false" }
                    ]} 
                />
            </div>
        </Section>
    )
}