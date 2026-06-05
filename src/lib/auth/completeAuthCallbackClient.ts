import type { SupabaseClient } from "@supabase/supabase-js"
import { getHashAuthParams, getSupabaseAuthErrorParams } from "@/lib/auth/parseAuthCallbackUrl"

/**
 * Hash fragment types allowed on `/auth/callback` (not password recovery — that uses `/auth/callback/recovery`).
 */
const HASH_TYPES_MAIN_CALLBACK = new Set(["magiclink", "signup", "email", "invite"])

export type CompleteAuthCallbackResult =
  | { ok: true }
  | { ok: false; reason: "missing_auth_payload" }
  | { ok: false; reason: "oauth_error"; errorCode: string | null }
  | { ok: false; reason: "exchange_failed"; message: string }
  | { ok: false; reason: "set_session_failed"; message: string }

/**
 * Finishes email verification, magic link, or OAuth (PKCE `code` or implicit hash tokens)
 * using the current browser URL. Call only from the client.
 */
export async function completeAuthCallbackClient(
  supabase: SupabaseClient,
  href: string
): Promise<CompleteAuthCallbackResult> {
  const u = new URL(href)

  const errorParams = getSupabaseAuthErrorParams(u)
  if (errorParams) {
    return { ok: false, reason: "oauth_error", errorCode: errorParams.get("error_code") }
  }

  const code = u.searchParams.get("code")
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return { ok: false, reason: "exchange_failed", message: error.message }
    }
    return { ok: true }
  }

  const hashParams = getHashAuthParams(u)
  if (!hashParams) {
    return { ok: false, reason: "missing_auth_payload" }
  }

  const accessToken = hashParams.get("access_token")
  const refreshToken = hashParams.get("refresh_token")
  const type = hashParams.get("type")

  if (!accessToken || !refreshToken) {
    return { ok: false, reason: "missing_auth_payload" }
  }

  if (type === "recovery") {
    return { ok: false, reason: "missing_auth_payload" }
  }

  if (type && !HASH_TYPES_MAIN_CALLBACK.has(type)) {
    return { ok: false, reason: "missing_auth_payload" }
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  if (error) {
    return { ok: false, reason: "set_session_failed", message: error.message }
  }

  return { ok: true }
}
