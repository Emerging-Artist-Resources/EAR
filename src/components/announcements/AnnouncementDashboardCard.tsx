"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { H3 } from "@/components/ui/typography"
import { CopyableValue } from "@/components/shared/CopyableValue"
import { cn } from "@/lib/utils"
import { getAnnouncementUrl } from "@/lib/config/constants"
import { ANNOUNCEMENT_POPUP_DEFAULT_CTA } from "@/features/announcements/popup"
import { timedHighlightClassName } from "@/hooks/use-timed-highlight"
import type { ResolvedDashboardAnnouncement } from "@/features/announcements/types"
import { AnnouncementMarkdown } from "./AnnouncementMarkdown"

type AnnouncementDashboardCardProps = {
  announcement: ResolvedDashboardAnnouncement
  highlighted?: boolean
}

export function AnnouncementDashboardCard({
  announcement,
  highlighted = false,
}: AnnouncementDashboardCardProps) {
  return (
    <Card
      id={`announcement-${announcement.id}`}
      className={cn(
        "scroll-mt-24 p-6 text-left transition-[box-shadow,background-color] duration-500",
        highlighted && timedHighlightClassName
      )}
    >
      <H3 className="text-lg">{announcement.title}</H3>
      {announcement.body ? (
        <AnnouncementMarkdown
          markdown={announcement.body}
          className="mt-1 text-sm text-gray-600"
        />
      ) : null}
      {announcement.widget ? (
        <CopyableValue value={announcement.widget.value} label={announcement.widget.label} />
      ) : null}
      {announcement.showLearnMore ? (
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href={getAnnouncementUrl(announcement.id)}>{ANNOUNCEMENT_POPUP_DEFAULT_CTA}</Link>
        </Button>
      ) : null}
    </Card>
  )
}
