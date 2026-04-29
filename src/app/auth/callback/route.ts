import { NextResponse } from "next/server"
import { exchangeAuthCodeFromRequest } from "@/lib/supabase/exchangeAuthCodeInRoute"

/**
 * Email verification, magic link sign-in, OAuth — not password recovery
 * (recovery uses `/auth/callback/recovery`).
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const nextParam = url.searchParams.get("next") ?? "/announcement"
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/announcement"

  const redirectUrl = new URL(next, url.origin)
  redirectUrl.searchParams.set("verified", "1")

  let response = NextResponse.redirect(redirectUrl)
  const result = await exchangeAuthCodeFromRequest(request, response)

  if (!result.ok) {
    return NextResponse.redirect(new URL("/auth/signin?error=auth", url.origin))
  }

  return response
}
