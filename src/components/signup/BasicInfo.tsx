"use client"

import { UseFormReturn } from "react-hook-form"
import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { EventFormData } from "@/lib/validations/events"
import { LocationField } from "../forms/blocks/LocationField"
interface BasicInfoProps {
    form: UseFormReturn<EventFormData>
}

export function BasicInfo({ form }: BasicInfoProps) {
    return (
        <Section title="Basic Info">
            <TextField form={form} name={"name"} label="Name" required/>
            <TextField form={form} name={"pronouns"} label="Pronouns" required/>
            <TextField form={form} name={"email"} label="Email" required/>
            <LocationField form={form} addressName={"address"} label="Address" required/>
            <TextField form={form} name={"company-name"} label="Company Name"/>
            <TextField form={form} name={"website"} label="Website"/>
        </Section>
    )
}