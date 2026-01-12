"use client"

import { useRouter } from "next/navigation"
import { useFormContext } from "react-hook-form"
import { SignUpPassword } from "@/components/signup/Password"
import { Button } from "@/components/ui/button"
import { signupAction } from "@/features/profile/server/signup"
import { useState } from "react"
import { Alert } from "@/components/ui/alert"

export default function SignUpPasswordPage() {
  const router = useRouter()
  const form = useFormContext()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = form.handleSubmit(async (data) => {
    setLoading(true)
    setError(null)

    try {
      const result = await signupAction(data)
      
      if (result?.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      router.push("/auth/signup/confirm")
    } catch (err) {
      console.error("Signup error:", err)
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  })

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="error">{error}</Alert>
      )}
      <SignUpPassword form={form as unknown as never} />
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

