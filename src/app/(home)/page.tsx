import { redirect } from "next/navigation"
import { HomeLanding } from "@/components/home/HomeLanding"

type HomeSearchParams = Record<string, string | string[] | undefined>

function toQueryString(sp: HomeSearchParams): string {
  const u = new URLSearchParams()
  for (const [key, value] of Object.entries(sp)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      for (const v of value) u.append(key, v)
    } else {
      u.set(key, value)
    }
  }
  return u.toString()
}

function first(sp: HomeSearchParams, key: string): string | undefined {
  const v = sp[key]
  if (Array.isArray(v)) return v[0]
  return v
}

type PageProps = {
  searchParams: Promise<HomeSearchParams>
}

/**
 * Supabase may send auth flows to Site URL (`/`) with ?code=... or error query params.
 * Handle those with server redirects; otherwise render the marketing home.
 */
export default async function HomePage({ searchParams }: PageProps) {
  const sp = await searchParams

  const code = first(sp, "code")
  if (code) {
    const type = first(sp, "type")
    const callbackPath = type === "recovery" || !type ? "/auth/callback/recovery" : "/auth/callback"
    const qs = toQueryString(sp)
    redirect(qs ? `${callbackPath}?${qs}` : callbackPath)
  }

  const oauthError = first(sp, "error")
  const errorCode = first(sp, "error_code")
  const errorDescription = first(sp, "error_description")
  if (
    oauthError === "access_denied" ||
    errorCode === "otp_expired" ||
    (errorDescription !== undefined && errorDescription.length > 0)
  ) {
    const q = errorCode === "otp_expired" ? "otp_expired" : "auth_link"
    redirect(`/auth/signin?error=${q}`)
  }

  return <HomeLanding />
}
