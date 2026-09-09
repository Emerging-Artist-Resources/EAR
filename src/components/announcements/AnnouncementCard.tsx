"use client"

import { ClampableText } from "@/components/calendar/ClampableText"
import { Card, CardContent } from "@/components/ui/card"
import { H3 } from "@/components/ui/typography"
import { LinkifiedText } from "@/components/shared/LinkifiedText"
import {
  announcementTimestamp,
  formatAnnouncementPostedDate,
  isNewAnnouncement,
} from "@/features/announcements/announcement-date"
import type { Announcement } from "@/features/announcements/types"
import { cn } from "@/lib/utils"
import { AnnouncementCtaButton } from "./AnnouncementCtaButton"

type AnnouncementCardVariant = "lead" | "feed" | "compact"

type AnnouncementCardProps = {
  announcement: Announcement
  variant?: AnnouncementCardVariant
  highlighted?: boolean
}

function NewPill() {
  return (
    <span className="inline-flex items-center bg-ear-dark-red px-2 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-ear-off-white">
      New
    </span>
  )
}

function AnnouncementMeta({
  isoDate,
  label,
  isNew,
}: {
  isoDate: string | null
  label: string
  isNew: boolean
}) {
  if (!label && !isNew) return <span />

  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && isoDate ? (
        <time dateTime={isoDate} className="text-sm text-ear-black/60">
          {label}
        </time>
      ) : null}
      {isNew ? <NewPill /> : null}
    </div>
  )
}

function AnnouncementBody({
  content,
  clampClassName,
  expanded,
  className,
}: {
  content: string
  clampClassName: string
  expanded: boolean
  className?: string
}) {
  if (expanded) {
    return (
      <p
        className={cn(
          "whitespace-pre-wrap font-sans text-base leading-6 text-ear-black [overflow-wrap:anywhere]",
          className
        )}
      >
        <LinkifiedText text={content} />
      </p>
    )
  }

  return (
    <ClampableText
      text={content}
      clampClassName={clampClassName}
      className={cn("text-ear-black/80", className)}
    />
  )
}

export function AnnouncementCard({
  announcement,
  variant = "feed",
  highlighted = false,
}: AnnouncementCardProps) {
  const isoDate = announcementTimestamp(announcement)
  const posted = formatAnnouncementPostedDate(isoDate)
  const isNew = isNewAnnouncement(isoDate)
  const hasImage = Boolean(announcement.heroImageUrl)
  const lead = variant === "lead"
  const compact = variant === "compact"

  const cardChrome = cn(
    "scroll-mt-24 overflow-hidden border-ear-black/15 shadow-none",
    lead ? "bg-surface-panel-alt" : "bg-ear-off-white",
    !hasImage && !highlighted && "border-l-4 border-ear-dark-red",
    highlighted && "border-l-4 border-ear-baby-blue bg-ear-cream-brown/25"
  )

  const footer = (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3",
        lead && "flex-col items-stretch sm:flex-row sm:items-center",
        announcement.cta && (lead ? "sm:justify-between" : "justify-between")
      )}
    >
      <AnnouncementMeta isoDate={isoDate} label={posted} isNew={isNew} />
      {announcement.cta ? (
        <AnnouncementCtaButton
          cta={announcement.cta}
          className={lead ? "w-full sm:w-auto" : undefined}
        />
      ) : null}
    </div>
  )

  if (compact) {
    return (
      <Card id={`announcement-${announcement.id}`} padding="none" className={cardChrome}>
        <div className="flex gap-4 p-4 sm:p-5">
          {hasImage ? (
            <div className="h-20 w-20 shrink-0 overflow-hidden bg-ear-black/5 sm:h-24 sm:w-24">
              {/* eslint-disable-next-line @next/next/no-img-element -- hero URL may be /public or an arbitrary https host */}
              <img
                src={announcement.heroImageUrl ?? ""}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <H3 className="mb-2 text-lg font-semibold text-ear-black">{announcement.title}</H3>
            <AnnouncementBody
              content={announcement.content}
              clampClassName="line-clamp-2"
              expanded={highlighted}
              className="mb-3"
            />
            {footer}
          </div>
        </div>
      </Card>
    )
  }

  if (lead) {
    return (
      <Card id={`announcement-${announcement.id}`} padding="none" className={cardChrome}>
        {hasImage ? (
          <div className="h-64 w-full overflow-hidden bg-ear-black/5 sm:h-80 lg:h-[28rem]">
            {/* eslint-disable-next-line @next/next/no-img-element -- hero URL may be /public or an arbitrary https host */}
            <img
              src={announcement.heroImageUrl ?? ""}
              alt=""
              className="h-full w-full object-cover object-top"
            />
          </div>
        ) : null}
        <CardContent className="p-6 sm:p-8">
          <H3 className="mb-3 font-header text-2xl font-bold tracking-tight text-ear-black">
            {announcement.title}
          </H3>
          <AnnouncementBody
            content={announcement.content}
            clampClassName="line-clamp-4"
            expanded={highlighted}
            className="mb-5 text-base"
          />
          {footer}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card id={`announcement-${announcement.id}`} padding="none" className={cardChrome}>
      {hasImage ? (
        <div className="aspect-[3/2] w-full overflow-hidden bg-ear-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element -- hero URL may be /public or an arbitrary https host */}
          <img
            src={announcement.heroImageUrl ?? ""}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}
      <CardContent className="p-6">
        <H3 className="mb-2 text-xl text-ear-black">{announcement.title}</H3>
        <AnnouncementBody
          content={announcement.content}
          clampClassName="line-clamp-4"
          expanded={highlighted}
          className="mb-4"
        />
        {footer}
      </CardContent>
    </Card>
  )
}
