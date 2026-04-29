"use client"

import { Suspense, useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

import { supabase } from "@/lib/supabase/client"
import { H2, Text } from "@/components/ui/typography"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { ROUTES } from "@/lib/constants"

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

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setInfo("Your password was updated. You can sign in below.")
    }
    const err = searchParams.get("error")
    if (err === "otp_expired") {
      setError(
        "That email link has expired or was already used. Request a new link with Forgot password, or for sign-up verification use Resend on the confirmation email screen."
      )
    } else if (err === "auth_link" || err === "auth") {
      setError(
        "We couldn't use that sign-in link. It may be invalid or expired. Try Forgot password or request a new verification email."
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
        router.replace("/announcement")
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <H2 className="mt-6 text-center">Welcome back to EAR</H2>
          <Text className="text-center mt-2 text-gray-600">Sign in to your account to continue</Text>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm flex flex-col gap-3">
            <div>
              <Text className="block text-sm font-medium text-gray-700 pb-1">Email</Text>
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
              <Text className="block text-sm font-medium text-gray-700 pb-1">Password</Text>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="text-right text-sm">
            <Link href="/auth/forgot-password" className="text-primary hover:opacity-80">
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

          <div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </div>

              <div className="text-center">
                <Text>
                  <Link href={ROUTES.SIGN_UP} className="text-primary hover:opacity-80">
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
            onClick={() => router.push("/announcement")}
            variant="outline"
            className="w-full justify-center border border-primary"
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-600">Loading…</p>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
