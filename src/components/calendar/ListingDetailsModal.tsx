"use client"

import { useState, useEffect, useMemo, type CSSProperties } from "react"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { CopyListingLinkButton } from "@/components/shared/CopyListingLinkButton"
import { SaveListingFavoriteButton } from "@/components/shared/SaveListingFavoriteButton"
import type { PublicListingDetail } from "./PublicListingDetailSections"
import { getListingTitle } from "@/features/events/server/listing-utils"
import { HorizontalScrollCards } from "@/components/shared/HorizontalScrollCards"
import { ListingCard } from "@/components/shared/ListingCard"
import {
  PieceDetails,
  ClassDetails,
  WorkshopDetails,
  AuditionDetails,
  CreativeDetails,
  FieldRow,
  SocialHandles,
} from "./PublicListingDetailSections"
import { PhotoThumbnail } from "@/components/shared/PhotoThumbnail"
import { H3, Text } from "@/components/ui/typography"
import { stripAdminNotes } from "@/lib/listings/admin-notes"
import { getCalendarListingTypeLabel } from "@/lib/listings/type-labels"
import { normalizeOrganizerProgramPiecesFromDb } from "@/lib/listings/organizer-program-pieces"
import { OrganizerProgramPieceDetailModal } from "./OrganizerProgramPieceDetailModal"
import {
  ListingOccurrencesSection,
  listingHasOccurrencesSectionContent,
} from "./ListingOccurrencesSection"
import { ListingBodyText } from "./performance-detail-shared"
import {
  PerformanceOrganizerDetailContent,
  type ChildListingSummary,
} from "./PerformanceOrganizerDetailContent"
import { PerformancePieceDetailContent } from "./PerformancePieceDetailContent"
import {
  isAuditionListingDetail,
  isOpportunityListingDetail,
  isClassListingDetail,
  isOrganizerPerformanceListing,
  isOrganizerWorkshopListing,
  isPiecePerformanceListing,
  normalizePublicListingRelations,
} from "@/lib/listings/display"
import { WorkshopOrganizerDetailContent } from "./WorkshopOrganizerDetailContent"
import { ClassDetailContent } from "./ClassDetailContent"
import { AuditionDetailContent } from "./AuditionDetailContent"
import { OpportunityDetailContent } from "./OpportunityDetailContent"
import { getFilterTypeColor } from "./event-colors"

function getTypeLabel(type: string): string {
  return getCalendarListingTypeLabel(type)
}

interface ListingDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  listingId: string | null
  onListingClick?: (listingId: string) => void
  /** When provided and matches listingId, skip the initial fetch (e.g. deep-link prefetch). */
  initialListing?: PublicListingDetail | null
  /** Prefetched error for deep links when the listing could not be loaded. */
  initialError?: string | null
}

export function ListingDetailsModal({
  isOpen,
  onClose,
  listingId,
  onListingClick,
  initialListing = null,
  initialError = null,
}: ListingDetailsModalProps) {
  const [listing, setListing] = useState<PublicListingDetail | null>(() => {
    if (initialListing && listingId && initialListing.id === listingId) {
      return normalizePublicListingRelations(initialListing)
    }
    return null
  })
  const [error, setError] = useState<string | null>(() => {
    if (initialListing && listingId && initialListing.id === listingId) return null
    return initialError
  })
  /** Ties `error` to a listing id so a stale failure cannot block the next open's spinner. */
  const [errorListingId, setErrorListingId] = useState<string | null>(() =>
    initialError && listingId ? listingId : null,
  )
  const [showAllDates, setShowAllDates] = useState(false)
  const [selectedOrganizerPieceId, setSelectedOrganizerPieceId] = useState<string | null>(null)
  const [childListings, setChildListings] = useState<ChildListingSummary[]>([])

  const activeListing = useMemo(() => {
    if (listing && listingId && listing.id === listingId) {
      return listing
    }
    if (initialListing && listingId && initialListing.id === listingId) {
      return normalizePublicListingRelations(initialListing)
    }
    return null
  }, [listing, listingId, initialListing])

  const activeError =
    activeListing
      ? null
      : initialError && listingId
        ? initialError
        : error && errorListingId === listingId
          ? error
          : null

  /**
   * Spinner on the first paint of a click-open (before the fetch effect runs).
   * Close leaves listing=null; without this derived flag the next open would flash
   * an empty modal frame for one paint.
   */
  const showLoading = Boolean(isOpen && listingId && !activeListing && !activeError)

  useEffect(() => {
    if (!isOpen || !listingId) {
      setListing(null)
      setError(null)
      setErrorListingId(null)
      setShowAllDates(false)
      setSelectedOrganizerPieceId(null)
      setChildListings([])
      return
    }

    if (initialListing && initialListing.id === listingId) {
      setListing(normalizePublicListingRelations(initialListing))
      setError(null)
      setErrorListingId(null)
      setShowAllDates(false)
      setSelectedOrganizerPieceId(null)
      return
    }

    if (initialError) {
      setListing(null)
      setError(initialError)
      setErrorListingId(listingId)
      setShowAllDates(false)
      setSelectedOrganizerPieceId(null)
      return
    }

    const abortController = new AbortController()
    setError(null)
    setErrorListingId(null)
    // Drop stale content when switching listings so the header/title don't flash.
    setListing(null)

    fetch(`/api/calendar/listing/${listingId}`, { signal: abortController.signal })
      .then(async (res) => {
        if (!res.ok) {
          const message = res.status === 404 ? "Listing not found" : "Failed to load listing"
          if (!abortController.signal.aborted) {
            setError(message)
            setErrorListingId(listingId)
          }
          return null
        }
        const json = await res.json()
        return json.data
      })
      .then((data) => {
        if (data == null) return
        if (!abortController.signal.aborted) {
          setListing(normalizePublicListingRelations(data))
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") return
        console.error("Error loading listing:", err)
        if (!abortController.signal.aborted) {
          setError("Failed to load listing")
          setErrorListingId(listingId)
        }
      })

    return () => {
      abortController.abort()
    }
  }, [isOpen, listingId, initialListing, initialError])

  useEffect(() => {
    if (!isOpen || !listingId) {
      setChildListings([])
      return
    }

    const abortController = new AbortController()
    
    fetch(`/api/calendar/listing/${listingId}/children`, { signal: abortController.signal })
      .then(async (res) => {
        if (!res.ok) {
          return []
        }
        const json = await res.json()
        return json.data || []
      })
      .then((data) => {
        if (!abortController.signal.aborted) {
          setChildListings(data)
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        console.error("Error loading child listings:", err)
        if (!abortController.signal.aborted) {
          setChildListings([])
        }
      })

    return () => {
      abortController.abort()
    }
  }, [isOpen, listingId])

  const title = activeListing ? getListingTitle(activeListing) : "Listing Details"
  const typeLabel = activeListing ? getTypeLabel(activeListing.type) : ""
  const isOrganizerPerformance = isOrganizerPerformanceListing(activeListing)
  const isPiecePerformance = isPiecePerformanceListing(activeListing)
  const isOrganizerWorkshop = isOrganizerWorkshopListing(activeListing)
  const isClassDetail = isClassListingDetail(activeListing)
  const isAuditionDetail = isAuditionListingDetail(activeListing)
  const isOpportunityDetail = isOpportunityListingDetail(activeListing)
  const isPerformanceRedesign =
    isOrganizerPerformance ||
    isPiecePerformance ||
    isOrganizerWorkshop ||
    isClassDetail ||
    isAuditionDetail ||
    isOpportunityDetail

  const parentListingId =
    activeListing?.piece_details?.parent_listing_id ||
    activeListing?.class_workshop_details?.parent_listing_id ||
    null
  const backToParentLabel = activeListing?.piece_details?.parent_listing_id
    ? "Back to Performance"
    : activeListing?.class_workshop_details?.parent_listing_id
    ? "Back to Workshop"
    : null

  const opportunityDatesSummary =
    activeListing?.type === "creative" && activeListing.creative_details?.dates?.trim()
      ? activeListing.creative_details.dates.trim()
      : null

  const sortedPhotos = useMemo(() => {
    if (!activeListing?.listing_photos?.length) return []
    return [...activeListing.listing_photos].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    )
  }, [activeListing?.listing_photos])

  const displayNotes = useMemo(
    () => stripAdminNotes(activeListing?.notes),
    [activeListing?.notes]
  )

  const organizerProgramPiecesDoc = useMemo(() => {
    if (activeListing?.type !== "performance") return null
    const pd = activeListing.performance_details
    if (!pd || pd.subtype !== "ORGANIZER") return null
    return normalizeOrganizerProgramPiecesFromDb(pd.organizer_program_pieces)
  }, [activeListing])

  const selectedOrganizerPiece = useMemo(() => {
    if (!selectedOrganizerPieceId || !organizerProgramPiecesDoc) return null
    return organizerProgramPiecesDoc.pieces.find((p) => p.id === selectedOrganizerPieceId) ?? null
  }, [selectedOrganizerPieceId, organizerProgramPiecesDoc])

  const navigateToListing = (nextListingId: string) => {
    onListingClick?.(nextListingId)
  }

  const handleDismissAll = () => {
    setSelectedOrganizerPieceId(null)
    onClose()
  }

  const showOrganizerPieceOverlay = selectedOrganizerPieceId !== null

  const listingDetailThemeStyle: CSSProperties | undefined = useMemo(() => {
    if (!activeListing) return undefined

    const colors = getFilterTypeColor(activeListing.type.toUpperCase())

    return {
      // `Modal` header uses `bg-primary` (primary-600), spinners use `border-primary-600`.
      ["--primary" as any]: colors.accent,
      ["--primary-500" as any]: colors.accent,
      ["--primary-600" as any]: colors.accent,
      ["--primary-700" as any]: colors.accent,

      // Badge `variant="primary"` and left accent bars use `brand-primary`.
      ["--brand-primary" as any]: colors.accent,
      ["--brand-primary-hover" as any]: colors.accent,

      // Loader text + header title should match the filter chip text color.
      ["--primary-foreground" as any]: colors.text,
      ["--text-inverse" as any]: colors.text,
    }
  }, [activeListing])

  return (
    <>
    <Modal
      isOpen={isOpen && !showOrganizerPieceOverlay}
      onClose={handleDismissAll}
      title={title}
      size="lg"
      headerClassName="bg-primary"
      chromeStyle={listingDetailThemeStyle}
      titleClassName={
        isPerformanceRedesign
          ? "font-title text-2xl font-bold leading-none tracking-wide md:text-3xl"
          : undefined
      }
      contentClassName="border-border-default bg-surface-modal-warm text-text-primary"
    >
      <div className="min-h-[calc(90vh-9rem)]">
      {showLoading && (
          <div className="flex h-full min-h-[calc(90vh-9rem)] items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <Text className="text-ear-black/70">Loading listing details...</Text>
            </div>
          </div>
        )}

        {activeError && (
          <div className="flex h-full min-h-[calc(90vh-9rem)] items-center justify-center py-12 text-center">
            <div>
            <Text className="text-status-error-fg mb-4">{activeError}</Text>
            <button
              onClick={onClose}
              className="text-brand-primary hover:text-brand-primary-hover underline"
            >
              Close
            </button>
            </div>
          </div>
        )}

        {!showLoading && !activeError && activeListing && (
          isOrganizerPerformance ? (
            <PerformanceOrganizerDetailContent
              listing={activeListing}
              typeLabel={typeLabel}
              sortedPhotos={sortedPhotos}
              childListings={childListings}
              organizerProgramPiecesDoc={organizerProgramPiecesDoc}
              showAllDates={showAllDates}
              onShowAllDatesChange={setShowAllDates}
              onListingClick={navigateToListing}
              onSelectOrganizerPiece={setSelectedOrganizerPieceId}
              parentListingId={parentListingId}
              backToParentLabel={backToParentLabel}
            />
          ) : isOrganizerWorkshop ? (
            <WorkshopOrganizerDetailContent
              listing={activeListing}
              typeLabel={typeLabel}
              sortedPhotos={sortedPhotos}
              childListings={childListings}
              showAllDates={showAllDates}
              onShowAllDatesChange={setShowAllDates}
              onListingClick={navigateToListing}
              parentListingId={parentListingId}
              backToParentLabel={backToParentLabel}
            />
          ) : isPiecePerformance ? (
            <PerformancePieceDetailContent
              listing={activeListing}
              typeLabel={typeLabel}
              sortedPhotos={sortedPhotos}
              showAllDates={showAllDates}
              onShowAllDatesChange={setShowAllDates}
              onListingClick={navigateToListing}
              parentListingId={parentListingId}
              backToParentLabel={backToParentLabel}
            />
          ) : isClassDetail ? (
            <ClassDetailContent
              listing={activeListing}
              typeLabel={typeLabel}
              sortedPhotos={sortedPhotos}
              showAllDates={showAllDates}
              onShowAllDatesChange={setShowAllDates}
              onListingClick={navigateToListing}
              parentListingId={parentListingId}
              backToParentLabel={backToParentLabel}
            />
          ) : isAuditionDetail ? (
            <AuditionDetailContent
              listing={activeListing}
              typeLabel={typeLabel}
              sortedPhotos={sortedPhotos}
              showAllDates={showAllDates}
              onShowAllDatesChange={setShowAllDates}
              onListingClick={navigateToListing}
              parentListingId={parentListingId}
              backToParentLabel={backToParentLabel}
            />
          ) : isOpportunityDetail ? (
            <OpportunityDetailContent
              listing={activeListing}
              typeLabel={typeLabel}
              sortedPhotos={sortedPhotos}
              onListingClick={navigateToListing}
              parentListingId={parentListingId}
              backToParentLabel={backToParentLabel}
            />
          ) : (
          <div className="min-w-0 max-w-full space-y-4">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-border-default">
              <div className="flex items-center gap-3">
                <Badge variant="primary" size="sm">{typeLabel}</Badge>
                {activeListing.company && (
                  <Text className="text-text-muted">{activeListing.company}</Text>
                )}
              </div>
              {listingId ? (
                <div className="flex items-center gap-2">
                  <CopyListingLinkButton listingId={listingId} status={activeListing.status} />
                  <SaveListingFavoriteButton listingId={listingId} />
                </div>
              ) : null}
            </div>
            {parentListingId && backToParentLabel && onListingClick && (
              <div>
                <button
                  type="button"
                  onClick={() => navigateToListing(parentListingId)}
                  className="text-sm text-brand-primary hover:text-brand-primary-hover underline"
                >
                  ← {backToParentLabel}
                </button>
              </div>
            )}

            {(() => {
              const hasTypeDetails = 
                (activeListing.type === "performance" && activeListing.performance_details) ||
                (activeListing.type === "class" && activeListing.class_workshop_details) ||
                (activeListing.type === "audition" && activeListing.audition_details) ||
                (activeListing.type === "creative" && activeListing.creative_details)
              
              if (!hasTypeDetails) return null
              
              return (
                <Card className="p-4">
                  <H3 className="mb-3 text-text-primary">Information</H3>
                  <div className="grid min-w-0 max-w-full grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-2">
                    {activeListing.type === "performance" && activeListing.performance_details && (
                      <>
                        {activeListing.performance_details.subtype === "PIECE" && activeListing.piece_details && (
                          <PieceDetails details={activeListing.piece_details} />
                        )}
                      </>
                    )}
                    {activeListing.type === "class" && activeListing.class_workshop_details && (
                      <>
                        {activeListing.class_workshop_details.class_workshop_type === "WORKSHOP" ? (
                          <WorkshopDetails details={activeListing.class_workshop_details} />
                        ) : (
                          <ClassDetails details={activeListing.class_workshop_details} />
                        )}
                      </>
                    )}
                    {activeListing.type === "audition" && activeListing.audition_details && (
                      <AuditionDetails details={activeListing.audition_details} />
                    )}
                    {activeListing.type === "creative" && activeListing.creative_details && (
                      <CreativeDetails details={activeListing.creative_details} />
                    )}
                  </div>
                </Card>
              )
            })()}

            {listingHasOccurrencesSectionContent(activeListing, opportunityDatesSummary) && (
              <Card className="p-4">
                <H3 className="mb-3 text-text-primary">Dates</H3>
                <ListingOccurrencesSection
                  listing={activeListing}
                  showAllDates={showAllDates}
                  onShowAllDatesChange={setShowAllDates}
                  opportunityDatesSummary={opportunityDatesSummary}
                  variant="legacy"
                />
              </Card>
            )}

            {childListings.length > 0 && (() => {
              const allPieces = childListings.every((child) => child.is_piece)
              const allClasses = childListings.every((child) => child.is_class)
              const childTitle = allPieces 
                ? "Pieces in this Performance"
                : allClasses
                ? "Classes in this Workshop"
                : "Related Listings"
              
              return (
                <HorizontalScrollCards
                  title={childTitle}
                  cardsPerView={3}
                  onCardClick={(index) => {
                    const childListing = childListings[index]
                    if (childListing && onListingClick) {
                      navigateToListing(childListing.id)
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
                      is_piece={child.is_piece}
                      piece_company={child.piece_company}
                      piece_description={child.piece_description}
                      choreographer={child.choreographer}
                      is_class={child.is_class}
                      class_description={child.class_description}
                      class_organizer={child.class_organizer}
                      class_teachers={child.class_teachers}
                      occurrences={child.occurrences}
                      onClick={() => {
                        if (onListingClick) {
                          navigateToListing(child.id)
                        }
                      }}
                    />
                  ))}
                </HorizontalScrollCards>
              )
            })()}

            {(sortedPhotos.length > 0) ||
            activeListing.social_handles ||
            displayNotes ? (
              <Card className="p-4">
                <H3 className="mb-3 text-text-primary">Additional Information</H3>
                <div className="space-y-0">
                  {sortedPhotos.length > 0 && (
                    <div className="py-2 col-span-2">
                      <Text className="text-text-muted mb-2">Photos:</Text>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {sortedPhotos.map((photo) => (
                          <PhotoThumbnail
                            key={photo.id}
                            photo={photo}
                            showDownload={false}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {(activeListing.social_handles || displayNotes) && (
                    <div className="grid min-w-0 max-w-full grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-2">
                      {activeListing.social_handles && (
                        <FieldRow
                          label="Social Media"
                          value={<SocialHandles socialHandles={activeListing.social_handles} />}
                        />
                      )}

                      {displayNotes && (
                        <FieldRow
                          label="Additional Information"
                          value={<ListingBodyText text={displayNotes} />}
                        />
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ) : null}
          </div>
          )
        )}
      </div>
    </Modal>

    <OrganizerProgramPieceDetailModal
      isOpen={isOpen && showOrganizerPieceOverlay}
      onClosePiece={() => setSelectedOrganizerPieceId(null)}
      onDismissAll={handleDismissAll}
      piece={selectedOrganizerPiece}
      parentListing={activeListing}
    />
    </>
  )
}
