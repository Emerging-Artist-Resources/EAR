"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FavoriteButton } from "@/components/ui/favorite-button"
import { H3, Text } from "@/components/ui/typography"
import { HorizontalScrollCards } from "@/components/shared/HorizontalScrollCards"
import { ListingCard } from "@/components/shared/ListingCard"
import { hasDisplayText } from "@/lib/listing-display"
import type { OrganizerProgramPiecesDocument } from "@/lib/organizer-program-pieces"
import {
  buildOccurrencesForOrganizerProgramPiece,
  firstOrganizerPiecePhotoCredit,
  firstOrganizerPiecePhotoUrl,
  organizerProgramPieceDisplayTitle,
} from "@/lib/organizer-program-pieces-display"
import { cn } from "@/lib/utils"
import type { PublicListingDetail } from "./PublicListingDetailSections"
import { SocialHandles } from "./PublicListingDetailSections"
import { ClampableText } from "./ClampableText"
import { ListingOccurrencesSection } from "./ListingOccurrencesSection"

export type ChildListingSummary = {
  id: string
  type: string
  title: string
  is_piece?: boolean
  is_class?: boolean
  starts_at_utc: string | null
  ends_at_utc: string | null
  piece_company?: string | null
  piece_company_website?: string | null
  piece_description?: string | null
  choreographer?: string | null
  class_title?: string | null
  class_description?: string | null
  class_organizer?: string | null
  class_teachers?: string | null
  class_price?: string | null
  class_link?: string | null
  class_style_category?: string | null
  notes?: string | null
  cover_image_url?: string | null
  cover_image_credit?: string | null
  occurrences?: Array<{
    id: string
    starts_at_utc: string
    ends_at_utc: string | null
    tz: string
  }>
}

type ListingPhoto = NonNullable<PublicListingDetail["listing_photos"]>[number]

function hasSocialHandlesContent(socialHandles: unknown): boolean {
  if (!socialHandles) return false
  let handles: Record<string, string> | null = null
  if (typeof socialHandles === "string") {
    try {
      handles = JSON.parse(socialHandles) as Record<string, string>
    } catch {
      return socialHandles.trim().length > 0
    }
  } else if (typeof socialHandles === "object" && socialHandles !== null) {
    handles = socialHandles as Record<string, string>
  }
  return Boolean(handles && Object.keys(handles).length > 0)
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2">
      <div className="font-sans text-sm font-semibold text-text-primary">{label}</div>
      <div className="mt-0.5 font-sans text-sm text-text-primary">{children}</div>
    </div>
  )
}

function HeroImageWithLightbox({
  photo,
  credit,
}: {
  photo: ListingPhoto
  credit: string | null
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightboxOpen])

  if (!photo.url) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="block w-full cursor-pointer overflow-hidden rounded-md border border-border-default text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        aria-label={credit ? `View image: ${credit}` : "View performance image"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={credit || "Performance image"}
          className="aspect-[3/4] w-full object-cover"
        />
      </button>
      {hasDisplayText(credit) && (
        <p className="mt-2 font-sans text-sm text-text-muted">{credit}</p>
      )}

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-ear-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Expanded performance image"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-md bg-ear-off-white/10 px-3 py-1.5 font-sans text-sm text-ear-off-white hover:bg-ear-off-white/20"
            onClick={() => setLightboxOpen(false)}
          >
            Close
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt={credit || "Performance image"}
            className="max-h-[90vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

export interface PerformanceOrganizerDetailContentProps {
  listing: PublicListingDetail
  typeLabel: string
  sortedPhotos: ListingPhoto[]
  childListings: ChildListingSummary[]
  organizerProgramPiecesDoc: OrganizerProgramPiecesDocument | null
  showAllDates: boolean
  onShowAllDatesChange: (showAll: boolean) => void
  isAuthed: boolean
  isSaved: boolean
  saving: boolean
  savingLoading: boolean
  saveError: string | null
  onToggleSave: () => void
  onListingClick?: (listingId: string) => void
  onClose: () => void
  onSelectOrganizerPiece: (pieceId: string) => void
  parentListingId?: string | null
  backToParentLabel?: string | null
}

export function PerformanceOrganizerDetailContent({
  listing,
  typeLabel,
  sortedPhotos,
  childListings,
  organizerProgramPiecesDoc,
  showAllDates,
  onShowAllDatesChange,
  isAuthed,
  isSaved,
  saving,
  savingLoading,
  saveError,
  onToggleSave,
  onListingClick,
  onClose,
  onSelectOrganizerPiece,
  parentListingId,
  backToParentLabel,
}: PerformanceOrganizerDetailContentProps) {
  const pd = listing.performance_details
  const heroPhoto = sortedPhotos[0]?.url ? sortedPhotos[0] : null
  const hasHeroPhoto = Boolean(heroPhoto?.url)

  const title = pd?.title?.trim() ?? ""
  const presentedBy = (pd?.organizer?.trim() || listing.company?.trim()) ?? ""
  const ticketPrice = pd?.price?.trim() ?? ""
  const ticketLink = pd?.link?.trim() ?? ""
  const description = pd?.description?.trim() ?? ""
  const participants =
    pd?.event_type === "SOLO" && hasDisplayText(pd?.participants) ? pd!.participants!.trim() : ""
  const website = pd?.website?.trim() ?? ""
  const notes = listing.notes?.trim() ?? ""
  const showSocial = hasSocialHandlesContent(listing.social_handles)

  const hasBodyText =
    hasDisplayText(title) ||
    hasDisplayText(presentedBy) ||
    hasDisplayText(ticketPrice) ||
    hasDisplayText(ticketLink) ||
    hasDisplayText(description) ||
    hasDisplayText(participants) ||
    showSocial ||
    hasDisplayText(website)

  const showBodySection = hasBodyText || hasHeroPhoto

  const embeddedPieces = organizerProgramPiecesDoc?.pieces ?? []
  const hasFeaturedWorks = embeddedPieces.length > 0 || childListings.length > 0

  const linkClass = "text-brand-primary hover:text-brand-primary-hover underline break-all"

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
            {(hasDisplayText(title) || hasDisplayText(presentedBy)) && (
              <div>
                {hasDisplayText(title) && (
                  <H3 className="mb-1 font-header text-2xl text-brand-primary">{title}</H3>
                )}
                {hasDisplayText(presentedBy) && (
                  <Text className="font-sans text-sm text-text-primary">
                    <span className="font-semibold">Presented by:</span> {presentedBy}
                  </Text>
                )}
              </div>
            )}
            {(hasDisplayText(ticketPrice) || hasDisplayText(ticketLink)) && (
              <div className="mt-5">
                {hasDisplayText(ticketPrice) && (
                  <Text className="font-sans text-sm text-text-primary">
                    <span className="font-semibold">Ticket Price:</span> {ticketPrice}
                  </Text>
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
              <FieldBlock label="Performance Description">
                <ClampableText text={description} />
              </FieldBlock>
            )}
            {hasDisplayText(participants) && (
              <FieldBlock label="Participating Artist/Companies">{participants}</FieldBlock>
            )}
            {showSocial && (
              <FieldBlock label="Social Media">
                <SocialHandles socialHandles={listing.social_handles} />
              </FieldBlock>
            )}
            {hasDisplayText(website) && (
              <FieldBlock label="Website">
                <a className={linkClass} href={website} target="_blank" rel="noopener noreferrer">
                  {website}
                </a>
              </FieldBlock>
            )}
          </div>

          {hasHeroPhoto && heroPhoto && (
            <div className="min-w-0 w-full md:max-w-[min(100%,280px)] md:justify-self-end">
              <HeroImageWithLightbox
                photo={heroPhoto}
                credit={heroPhoto.credit?.trim() ? heroPhoto.credit.trim() : null}
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

      {hasFeaturedWorks && (
        <section className="space-y-3">
          <H3 className="text-brand-primary">Featured Works</H3>
          <HorizontalScrollCards
            cardsPerView={3}
            onCardClick={(index) => {
              if (index < embeddedPieces.length) {
                const p = embeddedPieces[index]
                if (p) onSelectOrganizerPiece(p.id)
                return
              }
              const childIndex = index - embeddedPieces.length
              const child = childListings[childIndex]
              if (child && onListingClick) {
                onClose()
                onListingClick(child.id)
              }
            }}
          >
            {embeddedPieces.map((piece) => (
              <ListingCard
                key={piece.id}
                id={piece.id}
                type="performance"
                title={organizerProgramPieceDisplayTitle(piece)}
                is_piece
                piece_company={piece.company?.trim() ? piece.company : null}
                piece_company_website={piece.company_website}
                piece_description={piece.description?.trim() ? piece.description : null}
                choreographer={piece.choreographer}
                notes={piece.credits}
                occurrences={buildOccurrencesForOrganizerProgramPiece(
                  piece,
                  listing.listing_occurrences,
                )}
                coverImageUrl={firstOrganizerPiecePhotoUrl(piece)}
                coverImageAlt={
                  firstOrganizerPiecePhotoCredit(piece)
                    ? `Listing photo: ${firstOrganizerPiecePhotoCredit(piece)}`
                    : `${organizerProgramPieceDisplayTitle(piece)} — photo`
                }
                enableSave={false}
                onClick={() => onSelectOrganizerPiece(piece.id)}
              />
            ))}
            {childListings.map((child) => (
              <ListingCard
                key={child.id}
                id={child.id}
                type={child.type}
                title={child.title}
                starts_at_utc={child.starts_at_utc}
                ends_at_utc={child.ends_at_utc}
                is_piece={child.is_piece}
                piece_company={child.piece_company}
                piece_company_website={child.piece_company_website}
                piece_description={child.piece_description}
                choreographer={child.choreographer}
                is_class={child.is_class}
                class_title={child.class_title}
                class_description={child.class_description}
                class_organizer={child.class_organizer}
                class_teachers={child.class_teachers}
                class_price={child.class_price}
                class_link={child.class_link}
                class_style_category={child.class_style_category}
                notes={child.notes}
                occurrences={child.occurrences}
                coverImageUrl={child.cover_image_url}
                coverImageAlt={
                  child.cover_image_credit
                    ? `Listing photo: ${child.cover_image_credit}`
                    : `${child.title} — photo`
                }
                onClick={() => {
                  if (onListingClick) {
                    onClose()
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
          <H3 className="text-brand-primary">Additional Information</H3>
          <p className="whitespace-pre-wrap font-sans text-sm leading-6 text-text-primary">{notes}</p>
        </section>
      )}
    </div>
  )
}
