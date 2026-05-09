"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { completeAuthCallbackClient } from "@/lib/auth/completeAuthCallbackClient"
import { supabase } from "@/lib/supabase/client"
import { Text } from "@/components/ui/typography"
import { ROUTES } from "@/lib/constants"

function sanitizeNextParam(raw: string | null): string {
  const next = raw ?? ROUTES.HOME
  if (next.startsWith("/") && !next.startsWith("//")) return next
  return ROUTES.HOME
}

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      const nextPath = sanitizeNextParam(searchParams.get("next"))
      const result = await completeAuthCallbackClient(supabase, window.location.href)

      if (cancelled) return

      if (!result.ok) {
        if (result.reason === "oauth_error") {
          const q = result.errorCode === "otp_expired" ? "otp_expired" : "auth_link"
          router.replace(`/auth/signin?error=${q}`)
          return
        }
        if (result.reason === "missing_auth_payload") {
          setErrorMessage("This link is missing authentication data. It may have expired.")
          return
        }
        router.replace("/auth/signin?error=auth")
        return
      }

      const dest = new URL(nextPath, window.location.origin)
      dest.searchParams.set("verified", "1")
      router.replace(`${dest.pathname}${dest.search}`)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [router, searchParams])

  if (errorMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <Text className="text-gray-700 text-center max-w-md">{errorMessage}</Text>
        <a href="/auth/signin" className="mt-4 text-primary hover:opacity-80 text-sm font-medium">
          Back to sign in
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Text className="text-lg text-gray-700">Verifying your sign-in…</Text>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-4">
          <Text className="text-lg text-gray-700">Loading…</Text>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  )
}
