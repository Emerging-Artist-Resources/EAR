import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { getClientEnv } from "@/lib/config/env"

/**
 * PKCE code exchange for App Router GET handlers. Writes session cookies onto `redirectResponse`.
 */
export async function exchangeAuthCodeFromRequest(
  request: Request,
  redirectResponse: NextResponse
): Promise<{ ok: true } | { ok: false; message: string }> {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  if (!code) {
    return { ok: false, message: "missing_code" }
  }

  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getClientEnv()
  const cookieStore = await cookies()

  const supabase = createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          redirectResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error("[auth] exchangeCodeForSession:", error.message)
    return { ok: false, message: error.message }
  }

  return { ok: true }
}
