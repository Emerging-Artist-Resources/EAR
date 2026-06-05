"use client"

import { Suspense, useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

import { supabase } from "@/lib/supabase/client"
import { H1, Text } from "@/components/ui/typography"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { ROUTES } from "@/lib/config/constants"
import { ResendVerificationEmailForm } from "@/components/auth/ResendVerificationEmailForm"
import {
  authLinkErrorKindFromCode,
  getAuthLinkErrorContent,
} from "@/lib/auth/verification-link-errors"
import {
  AUTH_LINK_CLASS,
  AUTH_MUTED_TEXT_CLASS,
  AUTH_PAGE_CARD_CLASS,
  AUTH_PAGE_SHELL_CLASS,
} from "@/lib/auth/page-styles"

function sanitizeNextParam(raw: string | null): string {
  const next = raw ?? ROUTES.HOME
  if (next.startsWith("/") && !next.startsWith("//")) return next
  return ROUTES.HOME
}

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMountedRef = useRef(true)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const linkErrorParam = searchParams.get("error")
  const showVerificationResend =
    linkErrorParam === "otp_expired" || linkErrorParam === "auth_link"

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setInfo("Your password was updated. You can sign in below.")
    }
    const err = searchParams.get("error")
    if (err === "otp_expired") {
      const { description } = getAuthLinkErrorContent(
        authLinkErrorKindFromCode("otp_expired")
      )
      setError(description)
    } else if (err === "auth_link") {
      const { description } = getAuthLinkErrorContent(
        authLinkErrorKindFromCode(null)
      )
      setError(description)
    } else if (err === "auth") {
      setError(
        "We couldn't complete sign-in from that link. Try again below or use Forgot password."
      )
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError("")

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        if (isMountedRef.current) {
          setError(signInError.message || "Invalid credentials")
          setLoading(false)
        }
        return
      }

      if (!isMountedRef.current) return

      if (data?.session) {
        const nextPath = sanitizeNextParam(
          searchParams.get("next") ?? searchParams.get("returnTo")
        )
        router.replace(nextPath)
      } else {
        if (isMountedRef.current) {
          setError("Sign in failed. Please try again.")
          setLoading(false)
        }
      }
    } catch (err) {
      console.error("Sign in error:", err)
      if (isMountedRef.current) {
        setError("Something went wrong. Please try again.")
        setLoading(false)
      }
    }
  }

  return (
    <div className={AUTH_PAGE_SHELL_CLASS}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <H1 className="mt-6 text-center text-ear-black">Welcome back to EAR</H1>
          <Text className={`mt-2 text-center ${AUTH_MUTED_TEXT_CLASS}`}>
            Sign in to your account to continue
          </Text>
        </div>

        <Card className={AUTH_PAGE_CARD_CLASS}>
          <CardContent className="pt-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm flex flex-col gap-3">
            <div>
              <Text className="block pb-1 text-sm font-medium text-ear-black">Email</Text>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative pt-2">
              <Text className="block pb-1 text-sm font-medium text-ear-black">Password</Text>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ear-black/50 hover:text-ear-black focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="text-right text-sm">
            <Link href="/auth/forgot-password" className={AUTH_LINK_CLASS}>
              Forgot password?
            </Link>
          </div>

          {info && (
            <Alert variant="success" className="text-sm text-center">
              {info}
            </Alert>
          )}

          {error && (
            <Alert variant="error" className="text-sm text-center">
              {error}
            </Alert>
          )}

          {showVerificationResend ? (
            <div className="space-y-2 border-t border-ear-black/10 pt-4">
              <Text className="text-sm font-medium text-ear-black text-center">
                Need a new verification email?
              </Text>
              <ResendVerificationEmailForm
                initialEmail={email}
                showEmailField={!email.trim()}
              />
            </div>
          ) : null}

          <div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </div>

              <div className="text-center">
                <Text>
                  <Link href={ROUTES.SIGN_UP} className={AUTH_LINK_CLASS}>
                    Don&apos;t have an account? Sign up
                  </Link>
                </Text>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            type="button"
            onClick={() => router.push(ROUTES.HOME)}
            variant="outline"
            className="w-full justify-center border-ear-black/20 bg-white text-ear-black hover:bg-ear-black/5"
          >
            Continue as guest
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <div className={AUTH_PAGE_SHELL_CLASS}>
          <p className={AUTH_MUTED_TEXT_CLASS}>Loading…</p>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
