"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { completeAuthCallbackClient } from "@/lib/auth/completeAuthCallbackClient"
import { supabase } from "@/lib/supabase/client"
import { Text } from "@/components/ui/typography"
import { ROUTES } from "@/lib/config/constants"
import { AuthLinkErrorCard } from "@/components/auth/AuthLinkErrorCard"
import { ResendVerificationEmailForm } from "@/components/auth/ResendVerificationEmailForm"
import {
  authLinkErrorKindFromCode,
  getAuthLinkErrorContent,
  type AuthLinkErrorKind,
} from "@/lib/auth/verification-link-errors"
import { AUTH_PAGE_SHELL_CLASS, AUTH_MUTED_TEXT_CLASS } from "@/lib/auth/page-styles"

function sanitizeNextParam(raw: string | null): string {
  const next = raw ?? ROUTES.HOME
  if (next.startsWith("/") && !next.startsWith("//")) return next
  return ROUTES.HOME
}

type CallbackErrorState = {
  kind: AuthLinkErrorKind
}

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorState, setErrorState] = useState<CallbackErrorState | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      const nextPath = sanitizeNextParam(searchParams.get("next"))
      const result = await completeAuthCallbackClient(supabase, window.location.href)

      if (cancelled) return

      if (!result.ok) {
        if (result.reason === "oauth_error") {
          setErrorState({
            kind: authLinkErrorKindFromCode(result.errorCode),
          })
          return
        }
        if (result.reason === "missing_auth_payload") {
          setErrorState({ kind: "missing_payload" })
          return
        }
        if (result.reason === "exchange_failed" || result.reason === "set_session_failed") {
          setErrorState({ kind: "session_failed" })
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

  if (errorState) {
    const { title, description } = getAuthLinkErrorContent(errorState.kind)
    return (
      <AuthLinkErrorCard title={title} description={description}>
        <ResendVerificationEmailForm showEmailField />
      </AuthLinkErrorCard>
    )
  }

  return (
    <div className={AUTH_PAGE_SHELL_CLASS}>
      <Text className={`text-lg ${AUTH_MUTED_TEXT_CLASS}`}>Verifying your account…</Text>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className={AUTH_PAGE_SHELL_CLASS}>
          <Text className={AUTH_MUTED_TEXT_CLASS}>Loading…</Text>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  )
}
