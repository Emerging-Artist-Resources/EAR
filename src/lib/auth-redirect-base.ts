/**
 * Absolute origin for Supabase `redirectTo` from the browser (forgot password, etc.).
 */
export function getBrowserAuthRedirectBase(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "")
  if (env) return env
  if (typeof window !== "undefined") return window.location.origin
  return ""
}
