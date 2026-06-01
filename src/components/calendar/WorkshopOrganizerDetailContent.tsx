"use client"

import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "@/components/ui/favorite-button"
import { H3, Text } from "@/components/ui/typography"
import { HorizontalScrollCards } from "@/components/shared/HorizontalScrollCards"
import { ListingCard } from "@/components/shared/ListingCard"
import { stripAdminNotes } from "@/lib/listings/admin-notes"
import { hasDisplayText } from "@/lib/listings/display"
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
  ListingBodyText,
  ListingTitleGroup,
} from "./performance-detail-shared"
import type { ChildListingSummary } from "./PerformanceOrganizerDetailContent"

type ListingPhoto = NonNullable<PublicListingDetail["listing_photos"]>[number]

export interface WorkshopOrganizerDetailContentProps {
  listing: PublicListingDetail
  typeLabel: string
  sortedPhotos: ListingPhoto[]
  childListings: ChildListingSummary[]
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

export function WorkshopOrganizerDetailContent({
  listing,
  typeLabel,
  sortedPhotos,
  childListings,
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
}: WorkshopOrganizerDetailContentProps) {
  const cwd = listing.class_workshop_details
  const heroPhoto = sortedPhotos[0]?.url ? sortedPhotos[0] : null
  const hasHeroPhoto = Boolean(heroPhoto?.url)

  const title = cwd?.title?.trim() ?? ""
  const presentedBy = (cwd?.organizer?.trim() || listing.company?.trim()) ?? ""
  const workshopPrice = cwd?.price?.trim() ?? ""
  const dropInDetails = cwd?.drop_in_classes?.trim() ?? ""
  const registrationDetails = cwd?.link?.trim() ?? ""
  const description = cwd?.description?.trim() ?? ""
  const workDetails = cwd?.workshop_details?.trim() ?? ""
  const workshopSchedule = cwd?.classes_offered?.trim() ?? ""
  const website = cwd?.website?.trim() ?? ""
  const notes = stripAdminNotes(listing.notes) ?? ""
  const showSocial = hasSocialHandlesContent(listing.social_handles)

  const hasBodyText =
    hasDisplayText(title) ||
    hasDisplayText(presentedBy) ||
    hasDisplayText(workshopPrice) ||
    hasDisplayText(dropInDetails) ||
    hasDisplayText(registrationDetails) ||
    hasDisplayText(description) ||
    hasDisplayText(workDetails) ||
    hasDisplayText(workshopSchedule) ||
    showSocial ||
    hasDisplayText(website)

  const showBodySection = hasBodyText || hasHeroPhoto
  const hasFeaturedClasses = childListings.length > 0

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
            <ListingTitleGroup title={title} subtitle={presentedBy} subtitleLabel="Presented by" />
            {(hasDisplayText(workshopPrice) || hasDisplayText(dropInDetails)) && (
              <div className="space-y-0">
                {hasDisplayText(workshopPrice) && (
                  <InlineLabelRow label="Price">{workshopPrice}</InlineLabelRow>
                )}
                {hasDisplayText(dropInDetails) && (
                  <FieldBlock label="Drop-in Pricing & Details">
                    <ClampableText text={dropInDetails} />
                  </FieldBlock>
                )}
              </div>
            )}
            {hasDisplayText(registrationDetails) && (
              <FieldBlock label="Registration Link & Instructions">
                <ClampableText text={registrationDetails} />
              </FieldBlock>
            )}
            {hasDisplayText(description) && (
              <FieldBlock label="Workshop Description">
                <ClampableText text={description} />
              </FieldBlock>
            )}
            {hasDisplayText(workDetails) && (
              <FieldBlock label="Work Details">
                <ClampableText text={workDetails} />
              </FieldBlock>
            )}
            {hasDisplayText(workshopSchedule) && (
              <FieldBlock label="Workshop Schedule">
                <ClampableText text={workshopSchedule} />
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
                ariaLabelPrefix="workshop"
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

      {hasFeaturedClasses && (
        <section className="space-y-3">
          <H3 className="text-ear-black">Featured Classes</H3>
          <HorizontalScrollCards
            cardsPerView={3}
            onCardClick={(index) => {
              const child = childListings[index]
              if (child && onListingClick) {
                onListingClick(child.id)
              }
            }}
          >
            {childListings.map((child) => (
              <ListingCard
                key={child.id}
                id={child.id}
                type={child.type}
                title={child.title}
                host={child.host}
                description={child.description}
                venue={child.venue}
                price={child.price}
                link={child.link}
                submittedAt={child.submitted_at}
                starts_at_utc={child.starts_at_utc}
                ends_at_utc={child.ends_at_utc}
                is_class={child.is_class}
                class_description={child.class_description}
                class_organizer={child.class_organizer}
                class_teachers={child.class_teachers}
                occurrences={child.occurrences}
                onClick={() => {
                  if (onListingClick) {
                    onListingClick(child.id)
                  }
                }}
              />
            ))}
          </HorizontalScrollCards>
        </section>
      )}

      {hasDisplayText(notes) && (
        <section className="space-y-3">
          <H3 className="text-ear-black">Additional Information</H3>
          <ListingBodyText text={notes} />
        </section>
      )}
    </div>
  )
}
