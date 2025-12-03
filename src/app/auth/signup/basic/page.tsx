"use client"

import { useRouter } from "next/navigation"
import { useFormContext } from "react-hook-form"
import { SignUpBasicInfo } from "@/components/signup/BasicInfo"
import { Button } from "@/components/ui/button"

export default function SignUpBasicPage() {
  const router = useRouter()
  const form = useFormContext()

  return (
    <div className="space-y-6">
      <SignUpBasicInfo form={form as unknown as never} />
      <div className="flex justify-end">
        <Button type="button" variant="primary" onClick={() => router.push("/auth/signup/eligibility")}>
          Next
        </Button>
      </div>
    </div>
  )
}

