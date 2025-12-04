"use client"

import { useRouter } from "next/navigation"
import { useFormContext } from "react-hook-form"
import { SignUpWrapUp } from "@/components/signup/WrapUp"
import { Button } from "@/components/ui/button"

export default function SignUpWrapUpPage() {
  const router = useRouter()
  const form = useFormContext()

  const handleSubmit = form.handleSubmit(async (data) => {
    // TODO: Wire to Supabase auth sign-up 
    console.log("[signup] final submit", data)
    router.push("/auth/signin?message=Check your email to verify your account")
  })

  return (
    <div className="space-y-6">
      <SignUpWrapUp form={form as unknown as never} />
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => router.push("/auth/signup/eligibility")}>
          Back
        </Button>
        <Button type="button" variant="primary" onClick={() => handleSubmit()}>
          Create account
        </Button>
      </div>
    </div>
  )
}

