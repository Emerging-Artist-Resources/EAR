"use client"

import { useEffect, useState } from "react"
import { resendVerificationEmailAction } from "@/features/profile/server/resendVerification"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert } from "@/components/ui/alert"
import { Text } from "@/components/ui/typography"

type ResendVerificationEmailFormProps = {
  initialEmail?: string
  /** Show an email field when the address is unknown (e.g. expired callback link). */
  showEmailField?: boolean
}

export function ResendVerificationEmailForm({
  initialEmail = "",
  showEmailField,
}: ResendVerificationEmailFormProps) {
  const [email, setEmail] = useState(initialEmail)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [resendError, setResendError] = useState<string | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  useEffect(() => {
    setEmail(initialEmail)
  }, [initialEmail])

  const needsEmailField = showEmailField ?? !initialEmail.trim()

  const handleResend = async () => {
    const trimmed = email.trim()
    if (!trimmed || resendLoading || resendSent) return

    setResendLoading(true)
    setResendError(null)
    setResendMessage(null)

    const result = await resendVerificationEmailAction(trimmed)

    setResendLoading(false)

    if ("error" in result && result.error) {
      setResendError(result.error)
      return
    }

    if ("message" in result && result.message) {
      setResendMessage(result.message)
    }
    setResendSent(true)
  }

  return (
    <div className="space-y-3 text-left">
      {resendError && <Alert variant="error">{resendError}</Alert>}
      {resendMessage && <Alert variant="success">{resendMessage}</Alert>}

      {needsEmailField ? (
        <div>
          <Text className="block pb-1 text-sm font-medium text-ear-black">Email</Text>
          <Input
            id="resend-verification-email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={resendLoading || resendSent}
          />
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleResend}
        disabled={resendLoading || resendSent || !email.trim()}
      >
        {resendLoading ? "Sending…" : resendSent ? "Email sent" : "Resend verification email"}
      </Button>
    </div>
  )
}
