"use client"

import { useEffect, useState } from "react"
import { H3, Text } from "@/components/ui/typography"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { Announcement } from "@/features/announcements/types"
import { AnnouncementCard } from "./AnnouncementCard"

type AnnouncementsListProps = {
  limit?: number
  showHeader?: boolean
  className?: string
  variant?: "feed" | "compact"
  announcements?: Announcement[]
  highlightId?: string
}

export function AnnouncementsList({
  limit,
  showHeader = true,
  className,
  variant = "compact",
  announcements: initialAnnouncements,
  highlightId,
}: AnnouncementsListProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements ?? [])
  const [loading, setLoading] = useState(initialAnnouncements == null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialAnnouncements != null) {
      setAnnouncements(initialAnnouncements)
      setLoading(false)
      return
    }

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
  }, [initialAnnouncements])

  useEffect(() => {
    if (!highlightId || loading) return
    const el = document.getElementById(`announcement-${highlightId}`)
    el?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [highlightId, loading, announcements])

  const items = limit != null ? announcements.slice(0, limit) : announcements

  const body = loading ? (
    <Text className="text-gray-500">Loading announcements...</Text>
  ) : error ? (
    <Text className="text-sm text-red-600">{error}</Text>
  ) : items.length === 0 ? (
    <Text className="text-gray-500">No announcements at this time.</Text>
  ) : (
    <div className={variant === "feed" ? "space-y-6" : "space-y-4"}>
      {items.map((a) => (
        <AnnouncementCard
          key={a.id}
          announcement={a}
          variant={variant}
          highlighted={highlightId === a.id}
        />
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
              d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 3.988 0 01-1.564-.317z"
            />
          </svg>
          <H3>EAR Announcements</H3>
        </div>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
