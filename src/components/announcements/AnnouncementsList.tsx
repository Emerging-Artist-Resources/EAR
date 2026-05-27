"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { H3, Text } from "@/components/ui/typography"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { getNotificationTypeColor } from "@/lib/constants"

export type Announcement = {
  id: string
  title: string
  content: string
  type?: "INFO" | "WARNING" | "SUCCESS" | "ERROR"
  published_at?: string | null
  created_at?: string | null
}

function formatAnnouncementDate(date: string | null | undefined): string {
  if (!date) return ""
  const now = new Date()
  const pubDate = new Date(date)
  const diffTime = Math.abs(now.getTime() - pubDate.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Posted today"
  if (diffDays === 1) return "Posted 1 day ago"
  return `Posted ${diffDays} days ago`
}

interface AnnouncementsListProps {
  limit?: number
  showHeader?: boolean
  className?: string
}

export function AnnouncementsList({
  limit,
  showHeader = true,
  className,
}: AnnouncementsListProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    fetch("/api/announcements", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setAnnouncements((data.data as Announcement[]) ?? [])
        setLoading(false)
      })
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") return
        console.error("Error fetching announcements:", err)
        setError("Could not load announcements.")
        setLoading(false)
      })

    return () => controller.abort()
  }, [])

  const items = limit != null ? announcements.slice(0, limit) : announcements

  const body = loading ? (
    <Text className="text-gray-500">Loading announcements...</Text>
  ) : error ? (
    <Text className="text-sm text-red-600">{error}</Text>
  ) : items.length === 0 ? (
    <Text className="text-gray-500">No announcements at this time.</Text>
  ) : (
    <div className="space-y-4">
      {items.map((a) => (
        <div
          key={a.id}
          className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
        >
          <H3 className="mb-2 text-base">{a.title}</H3>
          <Text className="mb-2 line-clamp-2">{a.content}</Text>
          <div className="flex items-center justify-between">
            <Text className="text-sm text-error-600">
              {formatAnnouncementDate(a.published_at || a.created_at)}
            </Text>
            {a.type && (
              <Badge variant={getNotificationTypeColor(a.type)}>{a.type}</Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  )

  if (!showHeader) {
    return <div className={className}>{body}</div>
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
            />
          </svg>
          <H3>EAR Announcements</H3>
        </div>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
