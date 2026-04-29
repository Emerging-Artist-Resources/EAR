"use client"

import { useRouter } from "next/navigation"
import { useFormContext, UseFormReturn } from "react-hook-form"
import { SignUpWrapUp } from "@/components/signup/WrapUp"
import { Button } from "@/components/ui/button"
import { useToast } from "@/contexts/ToastContext"
import { useStepValidation } from "@/hooks/use-step-validation"
import { SIGNUP_STEPS, DEFAULT_ERROR_MESSAGE, type SignupFormData } from "@/lib/validations/signup"

export default function SignUpWrapUpPage() {
  const router = useRouter()
  const form = useFormContext()
  const { showToast } = useToast()
  const typedForm = form as unknown as UseFormReturn<SignupFormData>
  const { validateStep, getFirstError } = useStepValidation(typedForm, SIGNUP_STEPS.WRAP_UP)

  const handleNext = async () => {
    const isValid = await validateStep()
    if (!isValid) {
      const errorMessage = getFirstError() || DEFAULT_ERROR_MESSAGE
      showToast(errorMessage, "error")
      return
    }
    router.push("/auth/signup/password")
  }

  return (
    <div className="space-y-6">
      <SignUpWrapUp form={typedForm} />
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => router.push("/auth/signup/eligibility")}>
          Back
        </Button>
        <Button type="button" variant="primary" onClick={handleNext}>
          Next
        </Button>
      </div>
    </div>
  )
}

