"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { H2, Text } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { Alert } from "@/components/ui/alert"
import { resendVerificationEmailAction } from "@/features/profile/server/resendVerification"
import {
  AUTH_LINK_CLASS,
  AUTH_MUTED_TEXT_CLASS,
  AUTH_PAGE_CARD_CLASS,
  AUTH_PAGE_SHELL_CLASS,
} from "@/lib/auth/page-styles"

export default function SignUpConfirmPage() {
  const [email, setEmail] = useState("")
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [resendError, setResendError] = useState<string | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  useEffect(() => {
    const q = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")
    setEmail(q.get("email") ?? "")
  }, [])

  const handleResend = async () => {
    if (!email.trim() || resendLoading || resendSent) return
    setResendLoading(true)
    setResendError(null)
    setResendMessage(null)

    const result = await resendVerificationEmailAction(email.trim())

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
    <div className={AUTH_PAGE_SHELL_CLASS}>
      <div className="max-w-md w-full">
        <Card border="solid" className={AUTH_PAGE_CARD_CLASS}>
          <CardContent className="px-6 pb-8 pt-8">
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-ear-dark-sage" />
              </div>

              <div className="space-y-2">
                <H2 className="text-ear-black">Account created successfully</H2>
                <Text className={AUTH_MUTED_TEXT_CLASS}>
                  Check your email to verify your account. Once verified, you can sign in.
                </Text>
              </div>

              {email ? (
                <div className="space-y-3 text-left">
                  {resendError && <Alert variant="error">{resendError}</Alert>}
                  {resendMessage && <Alert variant="success">{resendMessage}</Alert>}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleResend}
                    disabled={resendLoading || resendSent}
                  >
                    {resendLoading ? "Sending…" : resendSent ? "Email sent" : "Resend verification email"}
                  </Button>
                </div>
              ) : null}

              <div className="pt-2">
                <Button asChild className="w-full">
                  <Link href="/auth/signin">Go to sign in</Link>
                </Button>
              </div>

              <Text className={`text-sm ${AUTH_MUTED_TEXT_CLASS}`}>
                Didn&apos;t receive an email? Check your spam folder or{" "}
                <Link href="/auth/signin" className={`${AUTH_LINK_CLASS} underline`}>
                  try signing in
                </Link>
                .
              </Text>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
