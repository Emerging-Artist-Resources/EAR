"use client"

import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "@/components/ui/favorite-button"
import { H3, Text } from "@/components/ui/typography"
import { hasDisplayText } from "@/lib/listing-display"
import { cn } from "@/lib/utils"
import type { PublicListingDetail } from "./PublicListingDetailSections"
import { SocialHandles } from "./PublicListingDetailSections"
import { ClampableText } from "./ClampableText"
import { ListingOccurrencesSection } from "./ListingOccurrencesSection"
import {
  FieldBlock,
  hasSocialHandlesContent,
  HeroImageWithLightbox,
  InlineLabelRow,
  InlineWebsiteLink,
  ListingTitleGroup,
} from "./performance-detail-shared"

type ListingPhoto = NonNullable<PublicListingDetail["listing_photos"]>[number]

export interface ClassDetailContentProps {
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

function formatLedBy(
  organizer: string,
  teachers: string,
  company: string,
): string {
  const org = organizer.trim()
  const teach = teachers.trim()
  const co = company.trim()
  if (org && teach && org !== teach) {
    return `${org}; ${teach}`
  }
  return org || teach || co
}

export function ClassDetailContent({
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
}: ClassDetailContentProps) {
  const cwd = listing.class_workshop_details
  const heroPhoto = sortedPhotos[0]?.url ? sortedPhotos[0] : null
  const hasHeroPhoto = Boolean(heroPhoto?.url)

  const title = cwd?.title?.trim() ?? ""
  const ledBy = formatLedBy(
    cwd?.organizer?.trim() ?? "",
    cwd?.teachers?.trim() ?? "",
    listing.company?.trim() ?? "",
  )
  const price = cwd?.price?.trim() ?? ""
  const registrationDetails = cwd?.link?.trim() ?? ""
  const description = cwd?.description?.trim() ?? ""
  const website = cwd?.website?.trim() ?? ""
  const notes = listing.notes?.trim() ?? ""
  const showSocial = hasSocialHandlesContent(listing.social_handles)

  const hasBodyText =
    hasDisplayText(title) ||
    hasDisplayText(ledBy) ||
    hasDisplayText(price) ||
    hasDisplayText(registrationDetails) ||
    hasDisplayText(description) ||
    showSocial ||
    hasDisplayText(website)

  const showBodySection = hasBodyText || hasHeroPhoto

  const showBackToParent = Boolean(
    parentListingId && backToParentLabel && onListingClick,
  )

  const handleBackToParent = () => {
    if (onListingClick && parentListingId) {
      onListingClick(parentListingId)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 border-b border-border-default pb-4">
        <Badge variant="primary" size="sm">
          {typeLabel}
        </Badge>
        {(showBackToParent || isAuthed) && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
            {showBackToParent && (
              <button
                type="button"
                onClick={handleBackToParent}
                className="text-sm text-brand-primary hover:text-brand-primary-hover underline"
              >
                ← {backToParentLabel}
              </button>
            )}
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
        )}
      </div>

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
            <ListingTitleGroup title={title} subtitle={ledBy} subtitleLabel="Led by" />
            {hasDisplayText(price) && <InlineLabelRow label="Price">{price}</InlineLabelRow>}
            {hasDisplayText(registrationDetails) && (
              <FieldBlock label="Registration Link & Instructions">
                <ClampableText text={registrationDetails} />
              </FieldBlock>
            )}
            {hasDisplayText(description) && (
              <FieldBlock label="Class Description">
                <ClampableText text={description} />
              </FieldBlock>
            )}
            {showSocial && (
              <FieldBlock label="Social Media">
                <SocialHandles socialHandles={listing.social_handles} />
              </FieldBlock>
            )}
            <InlineWebsiteLink href={website} />
          </div>

          {hasHeroPhoto && heroPhoto && (
            <div className="min-w-0 w-full md:max-w-[min(100%,280px)] md:justify-self-end">
              <HeroImageWithLightbox
                photo={heroPhoto}
                credit={heroPhoto.credit?.trim() ? heroPhoto.credit.trim() : null}
                ariaLabelPrefix="class"
              />
            </div>
          )}
        </section>
      )}

      <ListingOccurrencesSection
        listing={listing}
        showAllDates={showAllDates}
        onShowAllDatesChange={onShowAllDatesChange}
        variant="performance"
      />

      {hasDisplayText(notes) && (
        <section className="space-y-3">
          <H3 className="text-brand-primary">Additional Information</H3>
          <p className="whitespace-pre-wrap font-sans text-sm leading-6 text-text-primary">{notes}</p>
        </section>
      )}
    </div>
  )
}
