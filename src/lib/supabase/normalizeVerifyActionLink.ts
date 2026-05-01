/**
 * Local Kong routes GoTrue only under /auth/v1. Some SDK/GoTrue combinations
 * return action_link with path /verify, which Kong rejects ("no Route matched").
 */
export function normalizeSupabaseVerifyActionLink(url: string): string {
  try {
    const u = new URL(url)
    const path = u.pathname.replace(/\/+$/, "") || "/"
    if (path === "/verify") {
      u.pathname = "/auth/v1/verify"
      return u.toString()
    }
    return url
  } catch {
    return url
  }
}
