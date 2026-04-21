import { NextResponse } from "next/server"
import { exchangeAuthCodeFromRequest } from "@/lib/supabase/exchangeAuthCodeInRoute"

/**
 * Password recovery only. Supabase often drops query params on redirect, so we use a
 * dedicated path instead of `/auth/callback?next=/auth/reset-password`.
 *
 * Add this full URL to Supabase Auth → Redirect URLs, e.g.
 * `https://www.eararts.org/auth/callback/recovery`
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const redirectUrl = new URL("/auth/reset-password", url.origin)

  const oauthError = url.searchParams.get("error")
  const errorCode = url.searchParams.get("error_code")
  if (oauthError || errorCode || url.searchParams.get("error_description")) {
    const signinUrl = new URL("/auth/signin", url.origin)
    signinUrl.searchParams.set("error", errorCode === "otp_expired" ? "otp_expired" : "auth_link")
    return NextResponse.redirect(signinUrl)
  }

  let response = NextResponse.redirect(redirectUrl)
  const result = await exchangeAuthCodeFromRequest(request, response)

  // Recovery links can arrive with hash tokens only (no `code` query param).
  // In that case, let the browser land on `/auth/reset-password` so the client
  // SDK can finish processing the recovery token.
  if (!result.ok && result.message !== "missing_code") {
    return NextResponse.redirect(new URL("/auth/signin?error=auth", url.origin))
  }

  return response
}
