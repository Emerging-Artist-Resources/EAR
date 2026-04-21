"use client"

import { useState } from "react"
import Link from "next/link"
import { requestPasswordResetAction } from "@/features/profile/server/requestPasswordReset"
import { H2, Text } from "@/components/ui/typography"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/alert"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const result = await requestPasswordResetAction(email.trim())
      if ("error" in result && result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      setMessage(result.message ?? "If an account exists for that email, we sent a password reset link.")
      setLoading(false)
    } catch (err) {
      console.error(err)
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <H2 className="text-center">Reset your password</H2>
        <Text className="text-center text-gray-600 text-sm">
          Enter your email and we&apos;ll send you a link to choose a new password.
        </Text>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && <Alert variant="error">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>

        <div className="text-center space-y-2">
          <Text>
            <Link href="/auth/signin" className="text-primary hover:opacity-80">
              Back to sign in
            </Link>
          </Text>
          {/* <Text>
            <Link href="/announcement" className="text-gray-600 underline hover:text-gray-500 text-sm">
              Back to home
            </Link>
          </Text> */}
        </div>
      </div>
    </div>
  )
}
