"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { formatOccurrenceRangeEST } from "@/lib/datetime-utils"
import { getCalendarListingTypeLabel } from "@/lib/listing-type-labels"
import { listingHasLocationDisplay } from "@/lib/location-display"
import type { PublicListingDetail } from "./PublicListingDetailSections"
import { FieldRow } from "./PublicListingDetailSections"
import { ListingLocationDisplay } from "./ListingLocationDisplay"
import { H3, H4 } from "@/components/ui/typography"

function getOccurrenceLocation(
  occ: NonNullable<PublicListingDetail["listing_occurrences"]>[number] | undefined,
  fallback: PublicListingDetail,
) {
  if (!occ) return null
  return {
    address: occ.address || fallback.address,
    place_id: occ.place_id || fallback.place_id,
    venue_name: occ.venue_name || fallback.venue_name,
    location_instructions: occ.location_instructions || fallback.location_instructions,
    meta: fallback.meta,
  }
}

function getTypeLabel(type: string): string {
  return getCalendarListingTypeLabel(type)
}

export function listingHasOccurrencesSectionContent(
  listing: PublicListingDetail,
  opportunityDatesSummary: string | null,
): boolean {
  const { hasSingleLocation, singleLocation } = computeSingleLocation(listing)
  return Boolean(
    opportunityDatesSummary ||
      (hasSingleLocation && singleLocation && listingHasLocationDisplay(singleLocation)) ||
      (listing.listing_occurrences && listing.listing_occurrences.length > 0),
  )
}

function computeSingleLocation(listing: PublicListingDetail) {
  if (!listing.listing_occurrences || listing.listing_occurrences.length === 0) {
    return { hasSingleLocation: false, singleLocation: null as ReturnType<typeof getOccurrenceLocation> }
  }

  const firstLocation = getOccurrenceLocation(listing.listing_occurrences[0], listing)
  if (!firstLocation) {
    return { hasSingleLocation: false, singleLocation: null }
  }

  const allSame = listing.listing_occurrences.every((occ) => {
    const occLocation = getOccurrenceLocation(occ, listing)
    if (!occLocation) return false
    return (
      occLocation.address === firstLocation.address &&
      occLocation.place_id === firstLocation.place_id &&
      occLocation.venue_name === firstLocation.venue_name
    )
  })

  return {
    hasSingleLocation: allSame,
    singleLocation: allSame ? firstLocation : null,
  }
}

export type ListingOccurrencesSectionVariant = "legacy" | "performance"

export interface ListingOccurrencesSectionProps {
  listing: PublicListingDetail
  showAllDates: boolean
  onShowAllDatesChange: (showAll: boolean) => void
  opportunityDatesSummary?: string | null
  variant?: ListingOccurrencesSectionVariant
  className?: string
}

export function ListingOccurrencesSection({
  listing,
  showAllDates,
  onShowAllDatesChange,
  opportunityDatesSummary = null,
  variant = "legacy",
  className,
}: ListingOccurrencesSectionProps) {
  const { hasSingleLocation, singleLocation } = useMemo(
    () => computeSingleLocation(listing),
    [listing],
  )

  if (!listingHasOccurrencesSectionContent(listing, opportunityDatesSummary)) {
    return null
  }

  const isPerformance = variant === "performance"
  const occurrenceBorderClass = isPerformance ? "border-brand-primary" : "border-primary-300"

  const inner = (
    <div className="space-y-0">
      {opportunityDatesSummary && (
        <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-0">
          <FieldRow label="Opportunity Dates" value={opportunityDatesSummary} />
        </div>
      )}

      {hasSingleLocation && singleLocation && listingHasLocationDisplay(singleLocation) && (
        <div className={cn(isPerformance ? "mb-4" : "grid grid-cols-2 gap-x-6 gap-y-0")}>
          <ListingLocationDisplay
            location={{ ...singleLocation, meta: listing.meta }}
            linkifyAddress
            variant={isPerformance ? "performance" : "fieldRow"}
          />
        </div>
      )}

      {listing.listing_occurrences && listing.listing_occurrences.length > 0 && (
        <div className={isPerformance ? undefined : "mt-4"}>
          {(() => {
            const deadlines = listing.listing_occurrences
              .filter((o) => o.occurrence_type === "deadline")
              .sort(
                (a, b) =>
                  new Date(a.starts_at_utc).getTime() - new Date(b.starts_at_utc).getTime(),
              )
            const events = listing.listing_occurrences
              .filter((o) => !o.occurrence_type || o.occurrence_type === "event")
              .sort(
                (a, b) =>
                  new Date(a.starts_at_utc).getTime() - new Date(b.starts_at_utc).getTime(),
              )

            const eventTypeLabel = getTypeLabel(listing.type)

            const renderOccurrence = (
              o: NonNullable<PublicListingDetail["listing_occurrences"]>[number],
            ) => {
              const occurrenceLocation = getOccurrenceLocation(o, listing)
              const hasLocation =
                occurrenceLocation && listingHasLocationDisplay(occurrenceLocation)

              return (
                <div
                  key={o.id}
                  className={cn(
                    "border-l-4 pl-4 py-2 bg-surface-panel rounded-r",
                    occurrenceBorderClass,
                  )}
                >
                  <div className="font-header text-xl font-semibold text-text-primary mb-1">
                    {formatOccurrenceRangeEST(o.starts_at_utc, o.ends_at_utc)}
                  </div>
                  {!hasSingleLocation && hasLocation && occurrenceLocation && (
                    <ListingLocationDisplay
                      location={occurrenceLocation}
                      linkifyAddress
                      variant={isPerformance ? "performance-inline" : "inline"}
                    />
                  )}
                </div>
              )
            }

            return (
              <div className="space-y-4">
                {deadlines.length > 0 && (
                  <div>
                    <H4 className="text-text-muted mb-2">Deadlines</H4>
                    <div className="space-y-2">{deadlines.map(renderOccurrence)}</div>
                  </div>
                )}
                {events.length > 0 && (
                  <div>
                    {!isPerformance && (
                      <H4 className="text-text-muted mb-2">{eventTypeLabel} Dates</H4>
                    )}
                    <div className="space-y-2">
                      {events.slice(0, showAllDates ? events.length : 3).map(renderOccurrence)}
                      {events.length > 3 && !showAllDates && (
                        <button
                          type="button"
                          onClick={() => onShowAllDatesChange(true)}
                          className="mt-2 text-sm text-brand-primary hover:text-brand-primary-hover underline"
                        >
                          See more ({events.length - 3} more)
                        </button>
                      )}
                      {events.length > 3 && showAllDates && (
                        <button
                          type="button"
                          onClick={() => onShowAllDatesChange(false)}
                          className="mt-2 text-sm text-brand-primary hover:text-brand-primary-hover underline"
                        >
                          See less
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )

  if (isPerformance) {
    return (
      <section className={cn("space-y-3", className)}>
        <H3 className="text-brand-primary">Dates &amp; Times</H3>
        <div className="border border-border-default rounded-md bg-surface-panel p-4">{inner}</div>
      </section>
    )
  }

  return <div className={className}>{inner}</div>
}
