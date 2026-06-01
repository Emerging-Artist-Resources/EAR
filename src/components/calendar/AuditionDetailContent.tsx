"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "@/components/ui/favorite-button"
import { H3, Text } from "@/components/ui/typography"
import { formatOccurrenceRangeEST } from "@/lib/datetime/utils"
import { stripAdminNotes } from "@/lib/listings/admin-notes"
import { hasDisplayText } from "@/lib/listings/display"
import { cn } from "@/lib/utils"
import type { PublicListingDetail } from "./PublicListingDetailSections"
import { SocialHandles } from "./PublicListingDetailSections"
import { ClampableText } from "./ClampableText"
import { ListingOccurrencesSection } from "./ListingOccurrencesSection"
import {
  ApplicationFeeRow,
  DetailAccentPanel,
  DetailSectionCard,
  FieldBlock,
  hasSocialHandlesContent,
  HeroImageWithLightbox,
  InlineLabelRow,
  InlineWebsiteLink,
  ListingBodyText,
  ListingTitleGroup,
} from "./performance-detail-shared"

type ListingPhoto = NonNullable<PublicListingDetail["listing_photos"]>[number]

export interface AuditionDetailContentProps {
  listing: PublicListingDetail
  typeLabel: string
  sortedPhotos: ListingPhoto[]
  showAllDates: boolean
  onShowAllDatesChange: (showAll: boolean) => void
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

export function AuditionDetailContent({
  listing,
  typeLabel,
  sortedPhotos,
  showAllDates,
  onShowAllDatesChange,
  isAuthed,
  isSaved,
  saving,
  savingLoading,
  saveError,
  onToggleSave,
  onListingClick,
  parentListingId,
  backToParentLabel,
}: AuditionDetailContentProps) {
  const ad = listing.audition_details
  const heroPhoto = sortedPhotos[0]?.url ? sortedPhotos[0] : null
  const hasHeroPhoto = Boolean(heroPhoto?.url)

  const title = ad?.title?.trim() ?? ""
  const host = ad?.host?.trim() ?? ""
  const website = ad?.website?.trim() ?? ""
  const description = ad?.description?.trim() ?? ""
  const eligibility = ad?.eligibility?.trim() ?? ""
  const compensation = ad?.compensation?.trim() ?? ""
  const preAudition = ad?.pre_audition_classes?.trim() ?? ""
  const instructions = ad?.instructions?.trim() ?? ""
  const notes = stripAdminNotes(listing.notes) ?? ""
  const showSocial = hasSocialHandlesContent(listing.social_handles)

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
    hasDisplayText(description) ||
    hasDisplayText(eligibility) ||
    hasDisplayText(compensation) ||
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
            {hasDisplayText(description) && (
              <FieldBlock label="Opportunity Description">
                <ClampableText text={description} />
              </FieldBlock>
            )}
            {hasDisplayText(eligibility) && (
              <FieldBlock label="Eligibility">
                <ClampableText text={eligibility} />
              </FieldBlock>
            )}
            {hasDisplayText(compensation) && (
              <FieldBlock label="Compensation">
                <ListingBodyText text={compensation} />
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
                ariaLabelPrefix="audition"
              />
            </div>
          )}
        </section>
      )}

      <DetailSectionCard title="Application Information">
        <DetailAccentPanel>
          <ApplicationFeeRow feeAmount={ad?.fee_amount} className="py-0" />
          {hasDisplayText(preAudition) && (
            <FieldBlock label="Pre-Audition Opportunities" className="py-0">
              <ClampableText text={preAudition} />
            </FieldBlock>
          )}
          {hasDisplayText(instructions) && (
            <FieldBlock label="Application Submission Instructions" className="py-0">
              <ClampableText text={instructions} />
            </FieldBlock>
          )}
          {hasDisplayText(applicationDeadline) && (
            <InlineLabelRow label="Application Deadline" className="py-0">
              {applicationDeadline}
            </InlineLabelRow>
          )}
        </DetailAccentPanel>
      </DetailSectionCard>

      <ListingOccurrencesSection
        listing={listing}
        showAllDates={showAllDates}
        onShowAllDatesChange={onShowAllDatesChange}
        variant="performance"
        hideDeadlines
      />

      {hasDisplayText(notes) && (
        <section className="space-y-3">
          <H3 className="text-ear-black">Additional Information</H3>
          <ListingBodyText text={notes} />
        </section>
      )}
    </div>
  )
}
