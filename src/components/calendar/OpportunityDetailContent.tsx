"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "@/components/ui/favorite-button"
import { H3, Text } from "@/components/ui/typography"
import { formatOccurrenceRangeEST } from "@/lib/datetime/utils"
import { hasDisplayText } from "@/lib/listings/display"
import { listingHasLocationDisplay } from "@/lib/location/display"
import { cn } from "@/lib/utils"
import type { PublicListingDetail } from "./PublicListingDetailSections"
import { SocialHandles } from "./PublicListingDetailSections"
import { ClampableText } from "./ClampableText"
import { ListingLocationDisplay } from "./ListingLocationDisplay"
import {
  ApplicationFeeRow,
  DetailAccentPanel,
  DetailSectionCard,
  FieldBlock,
  hasSocialHandlesContent,
  HeroImageWithLightbox,
  InlineLabelRow,
  InlineWebsiteLink,
  ListingTitleGroup,
} from "./performance-detail-shared"

type ListingPhoto = NonNullable<PublicListingDetail["listing_photos"]>[number]

export interface OpportunityDetailContentProps {
  listing: PublicListingDetail
  typeLabel: string
  sortedPhotos: ListingPhoto[]
  isAuthed: boolean
  isSaved: boolean
  saving: boolean
  savingLoading: boolean
  saveError: string | null
  onToggleSave: () => void
  onListingClick?: (listingId: string) => void
  parentListingId?: string | null
  backToParentLabel?: string | null
}

function getListingLocation(listing: PublicListingDetail) {
  const occ = listing.listing_occurrences?.[0]
  return {
    address: occ?.address || listing.address,
    place_id: occ?.place_id || listing.place_id,
    venue_name: occ?.venue_name || listing.venue_name,
    location_instructions: occ?.location_instructions || listing.location_instructions,
    meta: listing.meta,
  }
}

export function OpportunityDetailContent({
  listing,
  typeLabel,
  sortedPhotos,
  isAuthed,
  isSaved,
  saving,
  savingLoading,
  saveError,
  onToggleSave,
  onListingClick,
  parentListingId,
  backToParentLabel,
}: OpportunityDetailContentProps) {
  const cd = listing.creative_details
  const heroPhoto = sortedPhotos[0]?.url ? sortedPhotos[0] : null
  const hasHeroPhoto = Boolean(heroPhoto?.url)

  const title = cd?.title?.trim() ?? ""
  const host = cd?.host?.trim() ?? ""
  const website = cd?.website?.trim() ?? ""
  const dates = cd?.dates?.trim() ?? ""
  const description = cd?.description?.trim() ?? ""
  const offered = cd?.compensation?.trim() ?? ""
  const requirements = cd?.requirements?.trim() ?? ""
  const submissionInstructions = cd?.link?.trim() ?? ""
  const notes = listing.notes?.trim() ?? ""
  const showSocial = hasSocialHandlesContent(listing.social_handles)

  const listingLocation = useMemo(() => getListingLocation(listing), [listing])
  const showLocation = listingHasLocationDisplay(listingLocation)

  const deadlines = useMemo(
    () =>
      (listing.listing_occurrences ?? [])
        .filter((o) => o.occurrence_type === "deadline")
        .sort(
          (a, b) =>
            new Date(a.starts_at_utc).getTime() - new Date(b.starts_at_utc).getTime(),
        ),
    [listing.listing_occurrences],
  )

  const applicationDeadline =
    deadlines.length > 0
      ? formatOccurrenceRangeEST(deadlines[0]!.starts_at_utc, deadlines[0]!.ends_at_utc)
      : ""

  const hasBodyText =
    hasDisplayText(title) ||
    hasDisplayText(host) ||
    hasDisplayText(website) ||
    hasDisplayText(dates) ||
    hasDisplayText(description) ||
    hasDisplayText(offered) ||
    showSocial

  const showBodySection = hasBodyText || hasHeroPhoto

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 border-b border-border-default pb-4">
        <Badge variant="primary" size="sm">
          {typeLabel}
        </Badge>
        {isAuthed && (
          <div className="flex items-center gap-2">
            {saveError && <Text className="text-status-error-fg">{saveError}</Text>}
            <FavoriteButton
              active={isSaved}
              onToggle={() => {
                if (!saving && !savingLoading) {
                  onToggleSave()
                }
              }}
              size="md"
              disabled={saving || savingLoading}
              aria-label={isSaved ? "Remove from favorites" : "Add to favorites"}
            />
          </div>
        )}
      </div>

      {parentListingId && backToParentLabel && onListingClick && (
        <div>
          <button
            type="button"
            onClick={() => onListingClick(parentListingId)}
            className="text-sm text-brand-primary hover:text-brand-primary-hover underline"
          >
            ← {backToParentLabel}
          </button>
        </div>
      )}

      {showBodySection && (
        <section
          className={cn(
            "grid gap-6 md:gap-8",
            hasHeroPhoto
              ? "grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
              : "grid-cols-1",
            "border-b border-border-default pb-6",
          )}
        >
          <div className="min-w-0 space-y-0">
            <ListingTitleGroup title={title} subtitle={host} />
            <InlineWebsiteLink href={website} />
            {hasDisplayText(dates) && (
              <FieldBlock label="Opportunity Dates">
                <p className="whitespace-pre-wrap font-sans text-sm leading-6 text-text-primary">
                  {dates}
                </p>
              </FieldBlock>
            )}
            {hasDisplayText(description) && (
              <FieldBlock label="Opportunity Description">
                <ClampableText text={description} />
              </FieldBlock>
            )}
            {hasDisplayText(offered) && (
              <FieldBlock label="What is Offered">
                <ClampableText text={offered} />
              </FieldBlock>
            )}
            {showSocial && (
              <FieldBlock label="Social Media">
                <SocialHandles socialHandles={listing.social_handles} />
              </FieldBlock>
            )}
          </div>

          {hasHeroPhoto && heroPhoto && (
            <div className="min-w-0 w-full md:max-w-[min(100%,280px)] md:justify-self-end">
              <HeroImageWithLightbox
                photo={heroPhoto}
                credit={heroPhoto.credit?.trim() ? heroPhoto.credit.trim() : null}
                ariaLabelPrefix="opportunity"
              />
            </div>
          )}
        </section>
      )}

      <DetailSectionCard title="Application Information">
        <DetailAccentPanel>
          <ApplicationFeeRow feeAmount={cd?.fee_amount} className="py-0" />
          {hasDisplayText(requirements) && (
            <FieldBlock label="Application Requirements" className="py-0">
              <ClampableText text={requirements} />
            </FieldBlock>
          )}
          {hasDisplayText(submissionInstructions) && (
            <FieldBlock label="Application Submission Instructions" className="py-0">
              <ClampableText text={submissionInstructions} />
            </FieldBlock>
          )}
          {hasDisplayText(applicationDeadline) && (
            <InlineLabelRow label="Application Deadline" className="py-0">
              {applicationDeadline}
            </InlineLabelRow>
          )}
        </DetailAccentPanel>
      </DetailSectionCard>

      {showLocation && (
        <DetailSectionCard title="Location">
          <DetailAccentPanel>
            <ListingLocationDisplay
              location={listingLocation}
              linkifyAddress
              variant="performance"
            />
          </DetailAccentPanel>
        </DetailSectionCard>
      )}

      {hasDisplayText(notes) && (
        <section className="space-y-3">
          <H3 className="text-brand-primary">Additional Information</H3>
          <p className="whitespace-pre-wrap font-sans text-sm leading-6 text-text-primary">{notes}</p>
        </section>
      )}
    </div>
  )
}
