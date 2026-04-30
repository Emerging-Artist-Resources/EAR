import type { SupabaseClient } from "@supabase/supabase-js"

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

  const oauthError = u.searchParams.get("error")
  const errorCode = u.searchParams.get("error_code")
  if (oauthError || errorCode || u.searchParams.get("error_description")) {
    return { ok: false, reason: "oauth_error", errorCode }
  }

  const code = u.searchParams.get("code")
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return { ok: false, reason: "exchange_failed", message: error.message }
    }
    return { ok: true }
  }

  const hashRaw = u.hash.startsWith("#") ? u.hash.slice(1) : u.hash
  if (!hashRaw) {
    return { ok: false, reason: "missing_auth_payload" }
  }

  const params = new URLSearchParams(hashRaw)
  const accessToken = params.get("access_token")
  const refreshToken = params.get("refresh_token")
  const type = params.get("type")

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
