"use client"

import { UseFormReturn } from "react-hook-form"
import { Section } from "@/components/forms/blocks/Section"
import { TextField } from "@/components/forms/blocks/TextField"
import { EventFormData } from "@/lib/validations/events"
import { LocationField } from "../forms/blocks/LocationField"
import { Dropdown } from "../forms/blocks/Dropdown"
import { useEffect } from "react"
interface SignUpBasicInfoProps {
    form: UseFormReturn<EventFormData>
}

export function SignUpBasicInfo({ form }: SignUpBasicInfoProps) {

    const type = form.watch("type") as string | undefined
    const isIndividual = type === "INDIVIDUAL"
    const isCompany = type === "COMPANY"
    const isFestivalOrganization = type === "FESTIVAL_ORGANIZATION"
    const isOther = type === "OTHER"

    useEffect(() => {
        if (isCompany) {
            form.setValue("company", "")
        }
        if (isFestivalOrganization) {
            form.setValue("festivalName", "")
        }
        if (isOther) {
            form.setValue("otherType", "")
        }
        if (isIndividual) {
            form.setValue("submitterName", "")
        }
    }, [isCompany, isFestivalOrganization, isOther, isIndividual, form])

    return (
        <Section title="Basic Info">
            <Dropdown form={form} name={"type"} label="Type" options={
                [{ label: "Individual", value: "INDIVIDUAL" }, 
                { label: "Company", value: "COMPANY" },
                { label: "Festival/Presenting Organization", value: "FESTIVAL_ORGANIZATION"},
                { label: "Other", value: "OTHER" }]} required/>
            {isIndividual && (
                <>
                    <TextField form={form} name={"submitterName"} label="Name" required/>
                    <TextField form={form} name={"submitterPronouns"} label="Pronouns" required/>
                    <TextField form={form} name={"submitterEmail"} label="Email" type="email" required/>
                    <TextField form={form} name={"website"} label="Website" />
                </>
            )}
            {isCompany && (
                <>
                    <TextField form={form} name={"companyName"} label="Company Name" required/>
                    <TextField form={form} name={"companyWebsite"} label="Company Website" type="url"/>
                    <TextField form={form} name={"contactName"} label="Contact Name" required/>
                    <TextField form={form} name={"contactEmail"} label="Contact Email" type="email"/>
                </>
            )}
            {isFestivalOrganization && (
                <>
                    <TextField form={form} name={"festivalName"} label="Festival Name" required/>
                    <TextField form={form} name={"festivalWebsite"} label="Festival Website" type="url"/>
                    <TextField form={form} name={"contactName"} label="Contact Name" required/>
                    <TextField form={form} name={"contactEmail"} label="Contact Email" type="email"/>
                </>
            )}
            {isOther && (
                <>
                    <TextField form={form} name={"otherType"} label="Other Type" required/>
                    <TextField form={form} name={"otherWebsite"} label="Website" type="url"/>
                    <TextField form={form} name={"contactName"} label="Contact Name" required/>
                    <TextField form={form} name={"contactEmail"} label="Contact Email" type="email"/>
                </>
            )}
            
        </Section>
    )
}