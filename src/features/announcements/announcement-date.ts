import { formatDate } from "@/lib/config/constants"

const NEW_WITHIN_DAYS = 7

export function announcementTimestamp(announcement: {
  publishedAt: string | null
  createdAt?: string | null
}): string | null {
  return announcement.publishedAt || announcement.createdAt || null
}

export function formatAnnouncementPostedDate(date: string | null | undefined): string {
  if (!date) return ""
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return ""
  return formatDate(parsed)
}

export function isNewAnnouncement(date: string | null | undefined, now = new Date()): boolean {
  if (!date) return false
  const published = new Date(date)
  if (Number.isNaN(published.getTime())) return false
  const diffDays = (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays < NEW_WITHIN_DAYS
}
