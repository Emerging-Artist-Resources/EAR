"use client"

import { useRouter } from "next/navigation"
import { useFormContext } from "react-hook-form"
import { SignUpWrapUp } from "@/components/signup/WrapUp"
import { Button } from "@/components/ui/button"

export default function SignUpWrapUpPage() {
  const router = useRouter()
  const form = useFormContext()

  return (
    <div className="space-y-6">
      <SignUpWrapUp form={form as unknown as never} />
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => router.push("/auth/signup/eligibility")}>
          Back
        </Button>
        <Button type="button" variant="primary" onClick={() => router.push("/auth/signup/password")}>
          Next
        </Button>
      </div>
    </div>
  )
}

