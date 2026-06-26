"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { H2, Text } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { ResendVerificationEmailForm } from "@/components/auth/ResendVerificationEmailForm"
import { AUTH_EMAIL_LINK_EXPIRY_LABEL } from "@/lib/auth/email-link-expiry"
import {
  AUTH_LINK_CLASS,
  AUTH_MUTED_TEXT_CLASS,
  AUTH_PAGE_CARD_CLASS,
  AUTH_PAGE_SHELL_CLASS,
} from "@/lib/auth/page-styles"

export default function SignUpConfirmPage() {
  const [email, setEmail] = useState("")

  useEffect(() => {
    const q = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")
    setEmail(q.get("email") ?? "")
  }, [])

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
                <Text className={`text-sm ${AUTH_MUTED_TEXT_CLASS}`}>
                  For security, the verification link expires in {AUTH_EMAIL_LINK_EXPIRY_LABEL}.
                </Text>
              </div>

              {email ? <ResendVerificationEmailForm initialEmail={email} /> : null}

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
