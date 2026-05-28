import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { getUserRole, getUserRoleFromProfile } from "@/lib/auth/authz"

function supabaseAuthCodeRedirect(req: NextRequest): NextResponse | null {
  const { pathname, searchParams } = req.nextUrl
  if (pathname !== "/") return null

  const code = searchParams.get("code")
  if (!code) return null

  const type = searchParams.get("type")
  const callbackPath = type === "recovery" || !type ? "/auth/callback/recovery" : "/auth/callback"
  const dest = new URL(callbackPath, req.url)

  searchParams.forEach((value, key) => {
    dest.searchParams.set(key, value)
  })

  return NextResponse.redirect(dest)
}

function supabaseAuthErrorRedirect(req: NextRequest): NextResponse | null {
  const { pathname, searchParams } = req.nextUrl
  if (pathname !== "/") return null

  const oauthError = searchParams.get("error")
  const errorCode = searchParams.get("error_code")
  if (
    oauthError === "access_denied" ||
    errorCode === "otp_expired" ||
    searchParams.has("error_description")
  ) {
    const dest = new URL("/auth/signin", req.url)
    dest.searchParams.set("error", errorCode === "otp_expired" ? "otp_expired" : "auth_link")
    return NextResponse.redirect(dest)
  }
  return null
}

export async function middleware(req: NextRequest) {
  const authCodeRedirect = supabaseAuthCodeRedirect(req)
  if (authCodeRedirect) return authCodeRedirect

  const authFailRedirect = supabaseAuthErrorRedirect(req)
  if (authFailRedirect) return authFailRedirect

  const { pathname } = req.nextUrl

  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.auth.getSession()

  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }
    let role = getUserRole(user)
    if (!role) {
      role = await getUserRoleFromProfile(supabase, user.id)
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
  ],
}
