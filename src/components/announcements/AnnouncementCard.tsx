"use client"

import { ClampableText } from "@/components/calendar/ClampableText"
import { Card, CardContent } from "@/components/ui/card"
import { H3, Muted } from "@/components/ui/typography"
import { LinkifiedText } from "@/components/shared/LinkifiedText"
import { cn } from "@/lib/utils"
import type { Announcement } from "@/features/announcements/types"
import { AnnouncementCtaButton } from "./AnnouncementCtaButton"

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

type AnnouncementCardProps = {
  announcement: Announcement
  variant?: "feed" | "compact"
  highlighted?: boolean
}

export function AnnouncementCard({
  announcement,
  variant = "feed",
  highlighted = false,
}: AnnouncementCardProps) {
  const posted = formatAnnouncementDate(announcement.publishedAt || announcement.createdAt)
  const compact = variant === "compact"

  const body = compact ? (
    <ClampableText
      text={announcement.content}
      clampClassName="line-clamp-2"
      className="mb-2 text-ear-black/80"
    />
  ) : (
    <p className="mb-4 whitespace-pre-wrap font-sans text-base leading-6 text-ear-black [overflow-wrap:anywhere]">
      <LinkifiedText text={announcement.content} />
    </p>
  )

  const footer = (
    <div className={cn("flex flex-wrap items-center gap-3", announcement.cta && "justify-between")}>
      {posted ? <Muted className="text-sm text-ear-black/60">{posted}</Muted> : <span />}
      {announcement.cta ? <AnnouncementCtaButton cta={announcement.cta} /> : null}
    </div>
  )

  if (compact) {
    return (
      <div
        id={`announcement-${announcement.id}`}
        className={cn(
          "scroll-mt-24 border-b border-gray-200 pb-4 last:border-b-0 last:pb-0",
          highlighted && "rounded-md ring-2 ring-primary ring-offset-2"
        )}
      >
        <H3 className="mb-2 text-base text-ear-black">{announcement.title}</H3>
        {body}
        {footer}
      </div>
    )
  }

  return (
    <Card
      id={`announcement-${announcement.id}`}
      padding="none"
      className={cn(
        "scroll-mt-24 overflow-hidden bg-ear-off-white",
        highlighted && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {announcement.heroImageUrl ? (
        <div className="aspect-[16/9] w-full overflow-hidden bg-ear-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element -- hero URL may be /public or an arbitrary https host */}
          <img
            src={announcement.heroImageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      <CardContent className="p-6">
        <H3 className="mb-2 text-xl text-ear-black">{announcement.title}</H3>
        {body}
        {footer}
      </CardContent>
    </Card>
  )
}
