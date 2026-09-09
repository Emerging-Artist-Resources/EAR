"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { H2, H3, Text } from "@/components/ui/typography"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { NewsletterSignupTrigger } from "@/components/newsletter/NewsletterSignupTrigger"
import { ROUTES } from "@/lib/config/constants"
import { announcementsEmpty } from "@/lib/content/announcements"
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

function AnnouncementsFeedSkeleton() {
  return (
    <div className="space-y-10" aria-hidden>
      <div className="overflow-hidden border border-ear-black/15">
        <div className="h-64 w-full animate-pulse bg-ear-black/10 sm:h-80" />
        <div className="space-y-3 p-6">
          <div className="h-7 w-2/3 animate-pulse bg-ear-black/10" />
          <div className="h-4 w-full animate-pulse bg-ear-black/10" />
          <div className="h-4 w-5/6 animate-pulse bg-ear-black/10" />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse border border-ear-black/15 bg-ear-black/5" />
        ))}
      </div>
    </div>
  )
}

function AnnouncementsCompactSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse border border-ear-black/15 bg-ear-black/5" />
      ))}
    </div>
  )
}

function EmptyAnnouncements() {
  return (
    <Card
      padding="none"
      className="overflow-hidden border-ear-black/15 border-l-4 border-l-ear-dark-red bg-ear-off-white shadow-none"
    >
      <CardContent className="p-6 sm:p-8">
        <H3 className="mb-3 font-header text-2xl font-bold text-ear-black sm:text-3xl">
          {announcementsEmpty.title}
        </H3>
        <Text className="mb-6 text-ear-black/80">{announcementsEmpty.body}</Text>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button variant="outline" className="border-ear-black text-ear-black" asChild>
            <Link href={ROUTES.CALENDAR}>{announcementsEmpty.calendarLabel}</Link>
          </Button>
          <NewsletterSignupTrigger source="announcements" sourceContext="empty-state">
            {({ onClick }) => (
              <Button variant="primary" type="button" onClick={onClick}>
                {announcementsEmpty.emailLabel}
              </Button>
            )}
          </NewsletterSignupTrigger>
        </div>
      </CardContent>
    </Card>
  )
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

  let body
  if (loading) {
    body = variant === "feed" ? <AnnouncementsFeedSkeleton /> : <AnnouncementsCompactSkeleton />
  } else if (error) {
    body = <Text className="text-sm text-red-600">{error}</Text>
  } else if (items.length === 0) {
    body = <EmptyAnnouncements />
  } else if (variant === "feed") {
    const [lead, ...rest] = items
    body = (
      <div className="space-y-10">
        <AnnouncementCard
          announcement={lead}
          variant="lead"
          highlighted={highlightId === lead.id}
        />
        {rest.length > 0 ? (
          <div>
            <H2 className="mb-6 text-xl font-bold uppercase tracking-wide text-ear-black">
              Earlier updates
            </H2>
            <div className="space-y-4">
              {rest.map((a) => (
                <AnnouncementCard
                  key={a.id}
                  announcement={a}
                  variant="compact"
                  highlighted={highlightId === a.id}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    )
  } else {
    body = (
      <div className="space-y-4">
        {items.map((a) => (
          <AnnouncementCard
            key={a.id}
            announcement={a}
            variant="compact"
            highlighted={highlightId === a.id}
          />
        ))}
      </div>
    )
  }

  if (!showHeader) {
    return <div className={className}>{body}</div>
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-gray-500"
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
