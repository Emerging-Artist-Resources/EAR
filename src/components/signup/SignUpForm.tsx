"use client"

import { UseFormReturn } from "react-hook-form"
import { SignUpBasicInfo } from "@/components/signup/BasicInfo"
import { SignUpWrapUp } from "@/components/signup/WrapUp"
import { SignUpEligibility } from "@/components/signup/Eligibility"
import { EventFormData } from "@/lib/validations/events"
import { Button } from "@/components/ui/button"

interface SignUpFormProps {
    form: UseFormReturn<EventFormData>
    onSubmit?: (data: EventFormData) => void | Promise<void>
}

export function SignUpForm({ form, onSubmit }: SignUpFormProps) {
  const handleSubmit = async (data: EventFormData) => {
    if (onSubmit) {
      await onSubmit(data)
    } else {
      // Default: just log for now; wire to Supabase in a follow-up
      console.log("[signup] submit", data)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <SignUpBasicInfo form={form} />
      <SignUpEligibility form={form} />
      <SignUpWrapUp form={form} />
      <div className="pt-2">
        <Button type="submit" className="w-full">Create account</Button>
      </div>
    </form>
  )
}