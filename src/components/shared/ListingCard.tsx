"use client"

import { useMemo, type ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { FavoriteButton } from "@/components/ui/favorite-button"
import { formatOccurrenceRangeEST } from "@/lib/datetime-utils"
import { useSavedListings } from "@/hooks/use-saved-listings"
import { useAuth } from "@/hooks/use-auth"
import { getEventTypeColor } from "@/components/calendar/event-colors"
import type { CalendarItem } from "@/hooks/use-calendar"
import type {
  ListingCardLinkDisplay,
  ListingCardOccurrence,
  ListingCardVenue,
} from "@/lib/listing-card-display"
import { splitListingCardOccurrences } from "@/lib/listing-card-display"
import { cn } from "@/lib/utils"

const MAX_EVENT_DATES_SHOWN = 3

interface ListingCardProps {
  id: string
  type: string
  title: string
  starts_at_utc?: string | null
  ends_at_utc?: string | null
  onClick?: () => void
  host?: string | null
  description?: string | null
  venue?: ListingCardVenue | null
  price?: string | null
  link?: ListingCardLinkDisplay | null
  submittedAt?: string | null
  is_piece?: boolean
  piece_company?: string | null
  piece_description?: string | null
  choreographer?: string | null
  is_class?: boolean
  class_description?: string | null
  class_organizer?: string | null
  class_teachers?: string | null
  occurrences?: ListingCardOccurrence[]
  enableSave?: boolean
}

function ListingCardFavoriteBar({ listingId }: { listingId: string }) {
  const { isAuthed } = useAuth()
  const { isSaved, loading, saving, toggleSave } = useSavedListings(listingId)
  if (!isAuthed) return null
  return (
    <div className="absolute top-3 right-3 z-10">
      <FavoriteButton
        active={isSaved}
        onToggle={(e) => {
          e.stopPropagation()
          if (!saving && !loading) {
            void toggleSave()
          }
        }}
        size="sm"
        disabled={saving || loading}
        aria-label={isSaved ? "Remove from favorites" : "Add to favorites"}
      />
    </div>
  )
}

function resolveHost(props: ListingCardProps): string | null {
  if (props.host?.trim()) return props.host.trim()
  if (props.is_piece) {
    return props.piece_company?.trim() || props.choreographer?.trim() || null
  }
  if (props.is_class) {
    return props.class_organizer?.trim() || props.class_teachers?.trim() || null
  }
  return null
}

function resolveDescription(props: ListingCardProps): string | null {
  if (props.description?.trim()) return props.description.trim()
  if (props.is_piece) return props.piece_description?.trim() || null
  if (props.is_class) return props.class_description?.trim() || null
  return null
}

function formatAddedDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function CardDetailRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="font-sans text-sm leading-snug">
      <span className="font-semibold text-text-primary">{label}: </span>
      <span className="text-text-muted">{children}</span>
    </div>
  )
}

function VenueRow({ venue }: { venue: ListingCardVenue }) {
  return (
    <CardDetailRow label="Location">
      {venue.mapsUrl && !venue.isOnline ? (
        <a
          href={venue.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-primary hover:text-brand-primary-hover underline"
          onClick={(e) => e.stopPropagation()}
        >
          {venue.name}
        </a>
      ) : (
        venue.name
      )}
    </CardDetailRow>
  )
}

export function ListingCard({
  id,
  type,
  title,
  starts_at_utc,
  ends_at_utc,
  onClick,
  host,
  description,
  venue,
  submittedAt,
  is_piece,
  piece_company,
  piece_description,
  choreographer,
  is_class,
  class_description,
  class_organizer,
  class_teachers,
  occurrences,
  enableSave = true,
}: ListingCardProps) {
  const typeColor = getEventTypeColor(type as CalendarItem["type"])

  const { deadlines, events: eventOccurrences } = useMemo(() => {
    if (occurrences?.length) {
      return splitListingCardOccurrences(occurrences)
    }
    if (starts_at_utc) {
      return {
        deadlines: [] as ListingCardOccurrence[],
        events: [
          {
            id: "primary",
            starts_at_utc,
            ends_at_utc: ends_at_utc ?? null,
            occurrence_type: "event",
          },
        ],
      }
    }
    return { deadlines: [], events: [] }
  }, [occurrences, starts_at_utc, ends_at_utc])

  const visibleDeadlines = deadlines.slice(0, MAX_EVENT_DATES_SHOWN)
  const remainingDeadlineCount = deadlines.length - visibleDeadlines.length
  const visibleEvents = eventOccurrences.slice(0, MAX_EVENT_DATES_SHOWN)
  const remainingEventCount = eventOccurrences.length - visibleEvents.length

  const displayHost = resolveHost({
    id,
    type,
    title,
    host,
    is_piece,
    piece_company,
    choreographer,
    is_class,
    class_organizer,
    class_teachers,
  })
  const displayDescription = resolveDescription({
    id,
    type,
    title,
    description,
    is_piece,
    piece_description,
    is_class,
    class_description,
  })
  const addedLabel = submittedAt ? formatAddedDate(submittedAt) : null
  const hasSchedule = visibleDeadlines.length > 0 || visibleEvents.length > 0
  const interactive = Boolean(onClick)

  return (
    <Card
      padding="none"
      className={cn(
        "flex h-full w-full flex-col overflow-hidden text-left transition-shadow relative",
        interactive ? "cursor-pointer hover:shadow-md" : "cursor-default",
      )}
      onClick={onClick}
    >
      <div
        className="h-1.5 w-full shrink-0"
        style={{ backgroundColor: typeColor.bg }}
        aria-hidden
      />

      <div className="flex min-h-0 flex-1 flex-col p-4">
        {enableSave ? <ListingCardFavoriteBar listingId={id} /> : null}

        <div className={cn(enableSave && "pr-8")}>
          <h4 className="font-header text-xl font-semibold leading-tight text-text-primary line-clamp-2">
            {title}
          </h4>
          {displayHost ? (
            <p className="mt-0.5 font-sans text-sm leading-snug text-text-muted">{displayHost}</p>
          ) : null}
        </div>

        <div className="mt-4 flex min-h-[7.5rem] flex-1 flex-col gap-2">
          {venue ? <VenueRow venue={venue} /> : null}
          {displayDescription ? (
            <p className="font-sans text-sm leading-snug text-text-muted line-clamp-3">
              {displayDescription}
            </p>
          ) : null}
        </div>

        <div className="mt-4 border-t border-border-default pt-4">
          {hasSchedule ? (
            <div className="space-y-2 font-sans text-xs text-text-muted">
              {visibleDeadlines.map((occ) => (
                <div key={occ.id}>
                  <span className="font-semibold text-text-primary">Deadline: </span>
                  {formatOccurrenceRangeEST(occ.starts_at_utc, occ.ends_at_utc)}
                </div>
              ))}
              {remainingDeadlineCount > 0 ? (
                <p>+{remainingDeadlineCount} more deadline{remainingDeadlineCount === 1 ? "" : "s"}</p>
              ) : null}
              {visibleEvents.map((occ) => (
                <div key={occ.id}>{formatOccurrenceRangeEST(occ.starts_at_utc, occ.ends_at_utc)}</div>
              ))}
              {remainingEventCount > 0 ? (
                <p>+{remainingEventCount} more date{remainingEventCount === 1 ? "" : "s"}</p>
              ) : null}
            </div>
          ) : null}

          {(interactive || addedLabel) ? (
            <div
              className={cn(
                "flex items-center justify-end gap-3 font-sans text-sm",
                hasSchedule ? "mt-4" : "mt-0",
              )}
            >
              {interactive ? (
                <span className="mr-auto font-medium text-brand-primary">Learn more →</span>
              ) : null}
              {addedLabel ? (
                <span className="shrink-0 text-xs text-text-muted">Added {addedLabel}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
