"use client"

import { useRouter } from "next/navigation"
import { useFormContext, UseFormReturn } from "react-hook-form"
import { SignUpPassword } from "@/components/signup/Password"
import { Button } from "@/components/ui/button"
import { signupAction } from "@/features/profile/server/signup"
import { useState } from "react"
import { Alert } from "@/components/ui/alert"
import { useToast } from "@/contexts/ToastContext"
import { getFieldLabel } from "@/lib/form-helpers"
import { DEFAULT_ERROR_MESSAGE, type SignupFormData } from "@/lib/validations/signup"

const SUBMIT_ERROR_MESSAGE = "Something went wrong. Please try again."

export default function SignUpPasswordPage() {
  const router = useRouter()
  const form = useFormContext()
  const { showToast } = useToast()
  const typedForm = form as unknown as UseFormReturn<SignupFormData>
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = typedForm.handleSubmit(
    async (data) => {
      setLoading(true)
      setError(null)

      try {
        const result = await signupAction(data)

        if (result?.error) {
          setError(result.error)
          showToast(result.error, "error")
          setLoading(false)
          return
        }

        router.push("/auth/signup/confirm")
      } catch (err) {
        console.error("Signup error:", err)
        setError(SUBMIT_ERROR_MESSAGE)
        showToast(SUBMIT_ERROR_MESSAGE, "error")
        setLoading(false)
      }
    },
    (errors) => {
      const firstError = Object.keys(errors)[0]
      if (firstError) {
        const fieldLabel = getFieldLabel(firstError)
        const errorMessage = `${fieldLabel} is required`
        showToast(errorMessage, "error")
      } else {
        showToast(DEFAULT_ERROR_MESSAGE, "error")
      }
    }
  )

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      <SignUpPassword form={typedForm} />
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/auth/signup/wrap-up")}
          disabled={loading}
        >
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={() => handleSubmit()}
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </div>
    </div>
  )
}

