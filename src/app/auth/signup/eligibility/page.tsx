"use client"

import { useRouter } from "next/navigation"
import { useFormContext } from "react-hook-form"
import { SignUpEligibility } from "@/components/signup/Eligibility"
import { Button } from "@/components/ui/button"

export default function SignUpEligibilityPage() {
  const router = useRouter()
  const form = useFormContext()

  return (
    <div className="space-y-6">
      <SignUpEligibility form={form as unknown as never} />
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => router.push("/auth/signup/basic")}>
          Back
        </Button>
        <Button type="button" variant="primary" onClick={() => router.push("/auth/signup/wrap-up")}>
          Next
        </Button>
      </div>
    </div>
  )
}

