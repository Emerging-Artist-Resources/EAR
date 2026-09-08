"use client"

import { Card } from "@/components/ui/card"
import { H3, Text } from "@/components/ui/typography"
import { LinkifiedText } from "@/components/shared/LinkifiedText"
import { CopyableValue } from "@/components/shared/CopyableValue"
import { cn } from "@/lib/utils"
import type { ResolvedDashboardAnnouncement } from "@/features/announcements/types"

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
        "scroll-mt-24 p-6 text-left",
        highlighted && "ring-2 ring-primary ring-offset-2"
      )}
    >
      <H3 className="text-lg">{announcement.title}</H3>
      <Text className="mt-1 whitespace-pre-wrap text-sm text-gray-600 [overflow-wrap:anywhere]">
        <LinkifiedText text={announcement.body} />
      </Text>
      <CopyableValue value={announcement.widget.value} label={announcement.widget.label} />
    </Card>
  )
}
