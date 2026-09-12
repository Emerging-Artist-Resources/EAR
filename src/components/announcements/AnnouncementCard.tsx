"use client"

import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { H3 } from "@/components/ui/typography"
import {
  announcementTimestamp,
  formatAnnouncementPostedDate,
  isNewAnnouncement,
} from "@/features/announcements/announcement-date"
import type { Announcement } from "@/features/announcements/types"
import { cn } from "@/lib/utils"
import { timedHighlightClassName } from "@/hooks/use-timed-highlight"
import { AnnouncementCtaGroup } from "./AnnouncementCtaButton"
import { AnnouncementMarkdown } from "./AnnouncementMarkdown"

type AnnouncementCardVariant = "lead" | "feed" | "compact"

type AnnouncementCardProps = {
  announcement: Announcement
  variant?: AnnouncementCardVariant
  highlighted?: boolean
  /** When omitted, follows `highlighted`. Deep links keep this true after the ring fades. */
  expanded?: boolean
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
  return (
    <AnnouncementMarkdown
      markdown={content}
      clampClassName={expanded ? undefined : clampClassName}
      className={className}
    />
  )
}

export function AnnouncementCard({
  announcement,
  variant = "feed",
  highlighted = false,
  expanded,
}: AnnouncementCardProps) {
  const isoDate = announcementTimestamp(announcement)
  const posted = formatAnnouncementPostedDate(isoDate)
  const isNew = isNewAnnouncement(isoDate)
  const hasImage = Boolean(announcement.heroImageUrl)
  const lead = variant === "lead"
  const compact = variant === "compact"
  const showFullBody = expanded ?? highlighted

  const cardChrome = cn(
    "overflow-hidden border-ear-black/15 shadow-none",
    lead ? "bg-surface-panel-alt" : "bg-ear-off-white",
    !hasImage && "border-l-4 border-ear-dark-red"
  )

  const frame = (children: ReactNode) => (
    <div
      id={`announcement-${announcement.id}`}
      className={cn(
        "scroll-mt-24 rounded-lg transition-[box-shadow,background-color] duration-500",
        highlighted && timedHighlightClassName
      )}
    >
      {children}
    </div>
  )

  const hasCta = Boolean(announcement.cta || announcement.secondaryCta)
  const footer = (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3",
        lead && "flex-col items-stretch sm:flex-row sm:items-center",
        hasCta && (lead ? "sm:justify-between" : "justify-between")
      )}
    >
      <AnnouncementMeta isoDate={isoDate} label={posted} isNew={isNew} />
      <AnnouncementCtaGroup
        cta={announcement.cta}
        secondaryCta={announcement.secondaryCta}
        stretch={lead}
      />
    </div>
  )

  if (compact) {
    return frame(
      <Card padding="none" className={cardChrome}>
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
              expanded={showFullBody}
              className="mb-3"
            />
            {footer}
          </div>
        </div>
      </Card>
    )
  }

  if (lead) {
    return frame(
      <Card padding="none" className={cardChrome}>
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
            expanded={showFullBody}
            className="mb-5 text-base"
          />
          {footer}
        </CardContent>
      </Card>
    )
  }

  return frame(
    <Card padding="none" className={cardChrome}>
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
          expanded={showFullBody}
          className="mb-4"
        />
        {footer}
      </CardContent>
    </Card>
  )
}
