import { isDonationFunnelPath } from "@/lib/donations/funnel-path"

export const ANNOUNCEMENT_POPUP_DEFAULT_CTA = "Learn more"

export type AnnouncementPopupCandidate = {
  id: string
  published_at?: string | null
  archived_at?: string | null
  popup_enabled?: boolean | null
}

export function announcementPopupDismissKey(id: string, revision: number): string {
  return `ear:announcement-popup:${id}:${revision}`
}

export function isAnnouncementPopupDismissed(
  storage: Pick<Storage, "getItem">,
  id: string,
  revision: number
): boolean {
  return storage.getItem(announcementPopupDismissKey(id, revision)) === "1"
}

export function dismissAnnouncementPopup(
  storage: Pick<Storage, "setItem">,
  id: string,
  revision: number
): void {
  storage.setItem(announcementPopupDismissKey(id, revision), "1")
}

export function shouldSkipAnnouncementPopup(pathname: string, search = ""): boolean {
  if (!pathname) return true
  if (pathname.startsWith("/auth")) return true
  if (pathname.startsWith("/admin")) return true
  if (pathname === "/announcement" || pathname.startsWith("/announcement/")) return true
  if (isDonationFunnelPath(pathname)) return true

  const query = search.startsWith("?") ? search.slice(1) : search
  const params = new URLSearchParams(query)
  return Boolean(params.get("listingId"))
}

export function pickActivePopupAnnouncement<T extends AnnouncementPopupCandidate>(
  rows: T[]
): T | null {
  const eligible = rows.filter(
    (row) =>
      row.popup_enabled === true &&
      row.published_at != null &&
      row.archived_at == null
  )
  if (eligible.length === 0) return null

  eligible.sort((a, b) => {
    const byPublished =
      new Date(b.published_at as string).getTime() - new Date(a.published_at as string).getTime()
    if (byPublished !== 0) return byPublished
    return b.id.localeCompare(a.id)
  })
  return eligible[0] ?? null
}
