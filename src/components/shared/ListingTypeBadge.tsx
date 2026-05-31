import { getEventTypeColor } from "@/components/calendar/event-colors"
import type { CalendarItem } from "@/hooks/use-calendar"
import { getCalendarListingTypeLabel } from "@/lib/listings/type-labels"
import { cn } from "@/lib/utils"

interface ListingTypeBadgeProps {
  type: string
  className?: string
  size?: "sm" | "md"
}

const badgeSizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-sm",
} as const

export function ListingTypeBadge({ type, className, size = "sm" }: ListingTypeBadgeProps) {
  const normalizedType = type.toLowerCase() as CalendarItem["type"]
  const colors = getEventTypeColor(normalizedType)
  const label = getCalendarListingTypeLabel(type)

  return (
    <span
      className={cn("inline-flex items-center rounded-full font-medium", badgeSizes[size], className)}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {label}
    </span>
  )
}
