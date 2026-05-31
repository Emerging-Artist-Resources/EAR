/**
 * Canonical public origin for redirects (emails, auth callbacks).
 * In development, prefer local origins to avoid Supabase allowlist fallback to Site URL.
 */
export function getPublicAppUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const localDefault = "http://localhost:3001"

  if (process.env.NODE_ENV !== "production") {
    // In dev, prefer local site URL to keep Supabase redirectTo values allowlisted.
    if (siteUrl) return siteUrl.replace(/\/$/, "")
    if (appUrl && /localhost|127\.0\.0\.1/i.test(appUrl)) return appUrl.replace(/\/$/, "")
    return localDefault
  }

  const explicit = appUrl || siteUrl
  if (explicit) return explicit.replace(/\/$/, "")

  return "https://www.eararts.org"
}
