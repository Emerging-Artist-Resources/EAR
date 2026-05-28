"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
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

/**
 * After `resetPasswordForEmail`, Supabase sends users through `/auth/callback` (PKCE),
 * then here with a session. Hash-based recovery is handled by retrying `getSession` briefly.
 */
export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [sessionReady, setSessionReady] = useState<boolean | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function hydrateSessionFromHash() {
      if (typeof window === "undefined") return
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash
      if (!hash) return

      const params = new URLSearchParams(hash)
      const accessToken = params.get("access_token")
      const refreshToken = params.get("refresh_token")
      const type = params.get("type")

      if (!accessToken || !refreshToken || type !== "recovery") return

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (sessionError) {
        console.error("[auth] recovery setSession:", sessionError.message)
        return
      }

      // Remove sensitive tokens from URL after successful hydration.
      window.history.replaceState(null, "", "/auth/reset-password")
    }

    async function waitForSession() {
      await hydrateSessionFromHash()

      for (let i = 0; i < 12; i++) {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session) {
          if (!cancelled) setSessionReady(true)
          return
        }
        await new Promise((r) => setTimeout(r, 100))
      }
      if (!cancelled) setSessionReady(false)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) {
        if (!cancelled) setSessionReady(true)
      }
    })

    void waitForSession()

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    setError("")

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message || "Could not update password.")
      setLoading(false)
      return
    }

    router.replace("/auth/signin?reset=success")
  }

  if (sessionReady === null) {
    return (
      <div className={AUTH_PAGE_SHELL_CLASS}>
        <Text className={AUTH_MUTED_TEXT_CLASS}>Loading…</Text>
      </div>
    )
  }

  if (sessionReady === false) {
    return (
      <div className={`${AUTH_PAGE_SHELL_CLASS} flex-col gap-6`}>
        <H2 className="text-center text-ear-black">Link invalid or expired</H2>
        <Text className={`text-center max-w-md ${AUTH_MUTED_TEXT_CLASS}`}>
          Request a new password reset link and try again.
        </Text>
        <Button asChild variant="primary">
          <Link href="/auth/forgot-password">Request new link</Link>
        </Button>
        <Link href="/auth/signin" className={`text-sm ${AUTH_LINK_CLASS}`}>
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className={AUTH_PAGE_SHELL_CLASS}>
      <div className="max-w-md w-full space-y-8">
        <H2 className="text-center text-ear-black">Choose a new password</H2>

        <Card className={AUTH_PAGE_CARD_CLASS}>
          <CardContent className="pt-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="relative">
            <label htmlFor="password" className="sr-only">
              New password
            </label>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="New password (min. 8 characters)"
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

          <div>
            <label htmlFor="confirmPassword" className="sr-only">
              Confirm password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating…" : "Update password"}
          </Button>
        </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/auth/signin" className={`text-sm ${AUTH_LINK_CLASS}`}>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
