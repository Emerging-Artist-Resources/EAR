import { isValidHttpUrl, normalizeUserEnteredUrl } from "@/lib/validations/flexible-url"

export function isAppPath(value: string): boolean {
  const t = value.trim()
  return t.startsWith("/") && !t.startsWith("//") && !t.includes("://")
}

/** Hero image or CTA href: in-app path (`/images/...`, `/profile?...`) or http(s). */
export function isSafeAnnouncementUrl(value: string): boolean {
  const t = value.trim()
  if (!t) return false
  if (isAppPath(t)) return true
  return isValidHttpUrl(normalizeUserEnteredUrl(t))
}

export function normalizeAnnouncementUrl(value: string): string | null {
  const t = value.trim()
  if (!t) return null
  if (isAppPath(t)) return t
  const normalized = normalizeUserEnteredUrl(t)
  return isValidHttpUrl(normalized) ? normalized : null
}
