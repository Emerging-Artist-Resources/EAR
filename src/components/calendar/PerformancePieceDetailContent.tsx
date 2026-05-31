"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FavoriteButton } from "@/components/ui/favorite-button"
import { H3, Text } from "@/components/ui/typography"
import {
  hasDisplayText,
  hasSocialHandlesContent,
  normalizePublicListingRelations,
} from "@/lib/listings/display"
import { stripAdminNotes } from "@/lib/listings/admin-notes"
import { cn } from "@/lib/utils"
import type { PublicListingDetail } from "./PublicListingDetailSections"
import { SocialHandles } from "./PublicListingDetailSections"
import { ClampableText } from "./ClampableText"
import { ListingOccurrencesSection } from "./ListingOccurrencesSection"
import {
  FieldBlock,
  HeroImageWithLightbox,
  InlineLabelRow,
  InlineWebsiteLink,
  ListingTitleGroup,
} from "./performance-detail-shared"

type ListingPhoto = NonNullable<PublicListingDetail["listing_photos"]>[number]

export interface PerformancePieceDetailContentProps {
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
  /** When set, back link calls this instead of `onListingClick(parentListingId)`. */
  onBackToParent?: () => void
  parentListingId?: string | null
  backToParentLabel?: string | null
  /** When false, hides save (e.g. embedded organizer program pieces). */
  showSave?: boolean
}

export function PerformancePieceDetailContent({
  listing: listingInput,
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
  onBackToParent,
  parentListingId,
  backToParentLabel,
  showSave = true,
}: PerformancePieceDetailContentProps) {
  const listing = useMemo(
    () => normalizePublicListingRelations(listingInput),
    [listingInput],
  )

  const piece = listing.piece_details
  const pd = listing.performance_details

  const heroPhoto = sortedPhotos[0]?.url ? sortedPhotos[0] : null
  const hasHeroPhoto = Boolean(heroPhoto?.url)

  const title = piece?.piece_title?.trim() ?? ""
  const presentedBy = piece?.piece_company?.trim() ?? ""
  const ticketPrice = pd?.price?.trim() ?? ""
  const ticketLink = pd?.link?.trim() ?? ""
  const description = piece?.piece_description?.trim() ?? ""
  const artistCredit =
    (pd?.participants?.trim() || piece?.choreographer?.trim()) ?? ""
  const website =
    (pd?.website?.trim() ||
      piece?.piece_company_website?.trim() ||
      listing.company_website?.trim()) ??
    ""
  const notes = stripAdminNotes(listing.notes) ?? ""
  const showSocial = hasSocialHandlesContent(listing.social_handles)

  const hasBodyText =
    hasDisplayText(title) ||
    hasDisplayText(presentedBy) ||
    hasDisplayText(ticketPrice) ||
    hasDisplayText(ticketLink) ||
    hasDisplayText(description) ||
    hasDisplayText(artistCredit) ||
    showSocial ||
    hasDisplayText(website)

  const showBodySection = hasBodyText || hasHeroPhoto
  const showBackToParent =
    Boolean(parentListingId && backToParentLabel && (onBackToParent || onListingClick))

  const handleBackToParent = () => {
    if (onBackToParent) onBackToParent()
    else if (onListingClick && parentListingId) onListingClick(parentListingId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 border-b border-border-default pb-4">
        <Badge variant="primary" size="sm">
          {typeLabel}
        </Badge>
        {(showBackToParent || (showSave && isAuthed)) && (
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
            {showSave && isAuthed && (
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
            <ListingTitleGroup title={title} subtitle={presentedBy} subtitleLabel="Presented by" />
            {(hasDisplayText(ticketPrice) || hasDisplayText(ticketLink)) && (
              <div className="space-y-0">
                {hasDisplayText(ticketPrice) && (
                  <InlineLabelRow label="Price">{ticketPrice}</InlineLabelRow>
                )}
                {hasDisplayText(ticketLink) && (
                  <div className="py-2">
                    <Button asChild variant="primary" size="default" className="mt-1">
                      <a href={ticketLink} target="_blank" rel="noopener noreferrer">
                        Get Tickets
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            )}
            {hasDisplayText(description) && (
              <FieldBlock label="Piece Description">
                <ClampableText text={description} />
              </FieldBlock>
            )}
            {hasDisplayText(artistCredit) && (
              <FieldBlock label="Artist Credit">
                <p className="whitespace-pre-wrap font-sans text-sm leading-6 text-text-primary">
                  {artistCredit}
                </p>
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
                creditLabel="Image credit"
                ariaLabelPrefix="piece"
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
