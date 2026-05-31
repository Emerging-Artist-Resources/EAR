"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useFormContext, UseFormReturn } from "react-hook-form"
import { SignUpPassword } from "@/components/signup/Password"
import { Button } from "@/components/ui/button"
import { signupAction } from "@/features/profile/server/signup"
import { Alert } from "@/components/ui/alert"
import { useToast } from "@/contexts/ToastContext"
import { getFieldLabel } from "@/lib/forms/helpers"
import {
  DEFAULT_ERROR_MESSAGE,
  type SignupFormData,
  type SignupErrorStep,
} from "@/lib/validations/signup"

const SUBMIT_ERROR_MESSAGE = "Something went wrong. Please try again."

const STEP_ROUTES: Record<SignupErrorStep, string> = {
  basic: "/auth/signup/basic",
  eligibility: "/auth/signup/eligibility",
  "wrap-up": "/auth/signup/wrap-up",
  password: "/auth/signup/password",
}

export default function SignUpPasswordPage() {
  const router = useRouter()
  const form = useFormContext()
  const { showToast } = useToast()
  const typedForm = form as unknown as UseFormReturn<SignupFormData>
  const [error, setError] = useState<string | null>(null)
  const [accountExists, setAccountExists] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = typedForm.handleSubmit(
    async (data) => {
      setLoading(true)
      setError(null)
      setAccountExists(false)

      try {
        const result = await signupAction(data)

        if (result && "error" in result && result.error) {
          if (result.code === "ACCOUNT_EXISTS") {
            setError(result.error)
            setAccountExists(true)
            showToast(result.error, "error")
            setLoading(false)
            return
          }

          showToast(result.error, "error")
          if (result.step && result.step !== "password") {
            router.push(STEP_ROUTES[result.step])
          } else {
            setError(result.error)
          }
          setLoading(false)
          return
        }

        const q = encodeURIComponent(data.email.trim())
        router.push(`/auth/signup/confirm?email=${q}`)
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
      {error && (
        <Alert variant="error">
          {accountExists ? (
            <>
              An account with this email already exists.{" "}
              <Link href="/auth/signin" className="font-medium underline underline-offset-2">
                Sign in
              </Link>
            </>
          ) : (
            error
          )}
        </Alert>
      )}
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
        <Button type="button" variant="primary" onClick={() => handleSubmit()} disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </div>
    </div>
  )
}
