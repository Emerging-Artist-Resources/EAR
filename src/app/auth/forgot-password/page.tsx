"use client"

import { useState } from "react"
import Link from "next/link"
import { requestPasswordResetAction } from "@/features/profile/server/requestPasswordReset"
import { H2, Text } from "@/components/ui/typography"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import {
  AUTH_LINK_CLASS,
  AUTH_MUTED_TEXT_CLASS,
  AUTH_PAGE_CARD_CLASS,
  AUTH_PAGE_SHELL_CLASS,
} from "@/lib/auth/page-styles"

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
    <div className={AUTH_PAGE_SHELL_CLASS}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <H2 className="text-center text-ear-black">Reset your password</H2>
          <Text className={`mt-2 text-center text-sm ${AUTH_MUTED_TEXT_CLASS}`}>
            Enter your email and we&apos;ll send you a link to choose a new password.
          </Text>
        </div>

        <Card className={AUTH_PAGE_CARD_CLASS}>
          <CardContent className="pt-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
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
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <Text>
            <Link href="/auth/signin" className={AUTH_LINK_CLASS}>
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
