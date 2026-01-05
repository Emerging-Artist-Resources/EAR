"use client"

import { UseFormReturn } from "react-hook-form"
import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { SignupFormData } from "@/lib/validations/signup"

interface SignUpPasswordProps {
    form: UseFormReturn<SignupFormData>
}

export function SignUpPassword({ form }: SignUpPasswordProps) {
    return (
        <Section title="Create Password">
            <TextField 
                form={form} 
                name={"password"} 
                label="Password" 
                type="password" 
                required
                note="Password must be at least 8 characters"
            />
            <TextField 
                form={form} 
                name={"confirmPassword"} 
                label="Confirm Password" 
                type="password" 
                required
            />
        </Section>
    )
}

