"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

/**
 * Supabase sends invalid/expired email links to Site URL (often `/`) with
 * ?error=access_denied&error_code=otp_expired&error_description=...
 */
function HomeRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get("code")
    if (code) {
      const type = searchParams.get("type")
      const callbackPath = type === "recovery" || !type ? "/auth/callback/recovery" : "/auth/callback"
      router.replace(`${callbackPath}?${searchParams.toString()}`)
      return
    }

    const oauthError = searchParams.get("error")
    const errorCode = searchParams.get("error_code")
    if (
      oauthError === "access_denied" ||
      errorCode === "otp_expired" ||
      searchParams.get("error_description")
    ) {
      const q = errorCode === "otp_expired" ? "otp_expired" : "auth_link"
      router.replace(`/auth/signin?error=${q}`)
      return
    }
    router.replace("/announcement")
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Redirecting…</div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">Redirecting…</div>
        </div>
      }
    >
      <HomeRedirect />
    </Suspense>
  )
}
