import type { SupabaseClient } from "@supabase/supabase-js"
import { completeAuthCallbackClient } from "./completeAuthCallbackClient"
import { getSupabaseAuthErrorParams } from "./parseAuthCallbackUrl"

function mockSupabase(): SupabaseClient {
  return {
    auth: {
      exchangeCodeForSession: jest.fn().mockResolvedValue({ error: null }),
      setSession: jest.fn().mockResolvedValue({ error: null }),
    },
  } as unknown as SupabaseClient
}

describe("getSupabaseAuthErrorParams", () => {
  it("reads otp_expired from URL hash", () => {
    const url = new URL(
      "https://www.eararts.org/auth/callback#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired"
    )
    const params = getSupabaseAuthErrorParams(url)
    expect(params?.get("error_code")).toBe("otp_expired")
    expect(params?.get("error")).toBe("access_denied")
  })

  it("reads errors from query string", () => {
    const url = new URL(
      "https://www.eararts.org/auth/callback?error=access_denied&error_code=otp_expired"
    )
    const params = getSupabaseAuthErrorParams(url)
    expect(params?.get("error_code")).toBe("otp_expired")
  })
})

describe("completeAuthCallbackClient", () => {
  it("returns oauth_error for expired verification links in the hash", async () => {
    const result = await completeAuthCallbackClient(
      mockSupabase(),
      "https://www.eararts.org/auth/callback#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired"
    )
    expect(result).toEqual({
      ok: false,
      reason: "oauth_error",
      errorCode: "otp_expired",
    })
  })

  it("returns missing_auth_payload when hash has no tokens or errors", async () => {
    const result = await completeAuthCallbackClient(
      mockSupabase(),
      "https://www.eararts.org/auth/callback"
    )
    expect(result).toEqual({ ok: false, reason: "missing_auth_payload" })
  })
})
