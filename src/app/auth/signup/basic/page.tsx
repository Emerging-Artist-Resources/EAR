"use client"

import { useRouter } from "next/navigation"
import { useFormContext, UseFormReturn } from "react-hook-form"
import { SignUpBasicInfo } from "@/components/signup/BasicInfo"
import { Button } from "@/components/ui/button"
import { useToast } from "@/contexts/ToastContext"
import { useStepValidation } from "@/hooks/use-step-validation"
import { SIGNUP_STEPS, DEFAULT_ERROR_MESSAGE, type SignupFormData } from "@/lib/validations/signup"

export default function SignUpBasicPage() {
  const router = useRouter()
  const form = useFormContext()
  const { showToast } = useToast()
  const typedForm = form as unknown as UseFormReturn<SignupFormData>
  const { validateStep, getFirstError } = useStepValidation(typedForm, SIGNUP_STEPS.BASIC)

  const handleNext = async () => {
    const isValid = await validateStep()
    if (!isValid) {
      const errorMessage = getFirstError() || DEFAULT_ERROR_MESSAGE
      showToast(errorMessage, "error")
      return
    }
    router.push("/auth/signup/eligibility")
  }

  return (
    <div className="space-y-6">
      <SignUpBasicInfo form={typedForm} />
      <div className="flex justify-end">
        <Button type="button" variant="primary" onClick={handleNext}>
          Next
        </Button>
      </div>
    </div>
  )
}

