"use client"

import { useState, useEffect, useMemo } from "react"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { FavoriteButton } from "@/components/ui/favorite-button"
import type { PublicListingDetail } from "./PublicListingDetailSections"
import { getListingTitle } from "@/features/events/server/listing-utils"
import { HorizontalScrollCards } from "@/components/shared/HorizontalScrollCards"
import { ListingCard } from "@/components/shared/ListingCard"
import { useSavedListings } from "@/hooks/use-saved-listings"
import { useAuth } from "@/hooks/use-auth"
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
import { getCalendarListingTypeLabel } from "@/lib/listing-type-labels"
import { normalizeOrganizerProgramPiecesFromDb } from "@/lib/organizer-program-pieces"
import { OrganizerProgramPieceDetailModal } from "./OrganizerProgramPieceDetailModal"
import {
  ListingOccurrencesSection,
  listingHasOccurrencesSectionContent,
} from "./ListingOccurrencesSection"
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
} from "@/lib/listing-display"
import { WorkshopOrganizerDetailContent } from "./WorkshopOrganizerDetailContent"
import { ClassDetailContent } from "./ClassDetailContent"
import { AuditionDetailContent } from "./AuditionDetailContent"
import { OpportunityDetailContent } from "./OpportunityDetailContent"

function getTypeLabel(type: string): string {
  return getCalendarListingTypeLabel(type)
}

interface ListingDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  listingId: string | null
  onListingClick?: (listingId: string) => void
}

export function ListingDetailsModal({ isOpen, onClose, listingId, onListingClick }: ListingDetailsModalProps) {
  const { isAuthed } = useAuth();
  const { isSaved, loading: savingLoading, saving, error: saveError, toggleSave } = useSavedListings(listingId || undefined);
  const [loading, setLoading] = useState(false)
  const [listing, setListing] = useState<PublicListingDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAllDates, setShowAllDates] = useState(false)
  const [selectedOrganizerPieceId, setSelectedOrganizerPieceId] = useState<string | null>(null)
  const [childListings, setChildListings] = useState<ChildListingSummary[]>([])

  useEffect(() => {
    if (!isOpen || !listingId) {
      setListing(null)
      setError(null)
      setShowAllDates(false)
      setSelectedOrganizerPieceId(null)
      setChildListings([])
      return
    }

    const abortController = new AbortController()
    setLoading(true)
    setError(null)
    
    fetch(`/api/calendar/listing/${listingId}`, { signal: abortController.signal })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Listing not found")
          }
          throw new Error("Failed to load listing")
        }
        const json = await res.json()
        return json.data
      })
      .then((data) => {
        if (!abortController.signal.aborted) {
          setListing(normalizePublicListingRelations(data))
          setLoading(false)
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        console.error("Error loading listing:", err)
        if (!abortController.signal.aborted) {
          setError(err.message || "Failed to load listing")
          setLoading(false)
        }
      })

    return () => {
      abortController.abort()
    }
  }, [isOpen, listingId])

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

  const title = listing ? getListingTitle(listing) : "Listing Details"
  const typeLabel = listing ? getTypeLabel(listing.type) : ""
  const isOrganizerPerformance = isOrganizerPerformanceListing(listing)
  const isPiecePerformance = isPiecePerformanceListing(listing)
  const isOrganizerWorkshop = isOrganizerWorkshopListing(listing)
  const isClassDetail = isClassListingDetail(listing)
  const isAuditionDetail = isAuditionListingDetail(listing)
  const isOpportunityDetail = isOpportunityListingDetail(listing)
  const isPerformanceRedesign =
    isOrganizerPerformance ||
    isPiecePerformance ||
    isOrganizerWorkshop ||
    isClassDetail ||
    isAuditionDetail ||
    isOpportunityDetail

  const parentListingId =
    listing?.piece_details?.parent_listing_id || listing?.class_workshop_details?.parent_listing_id || null
  const backToParentLabel = listing?.piece_details?.parent_listing_id
    ? "Back to Performance"
    : listing?.class_workshop_details?.parent_listing_id
    ? "Back to Workshop"
    : null

  const opportunityDatesSummary =
    listing?.type === "creative" && listing.creative_details?.dates?.trim()
      ? listing.creative_details.dates.trim()
      : null

  const sortedPhotos = useMemo(() => {
    if (!listing?.listing_photos?.length) return []
    return [...listing.listing_photos].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    )
  }, [listing?.listing_photos])

  const organizerProgramPiecesDoc = useMemo(() => {
    if (listing?.type !== "performance") return null
    const pd = listing.performance_details
    if (!pd || pd.subtype !== "ORGANIZER") return null
    return normalizeOrganizerProgramPiecesFromDb(pd.organizer_program_pieces)
  }, [listing])

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

  return (
    <>
    <Modal
      isOpen={isOpen && !showOrganizerPieceOverlay}
      onClose={handleDismissAll}
      title={title}
      size="lg"
      headerClassName="bg-primary"
      titleClassName={
        isPerformanceRedesign
          ? "font-title text-2xl font-bold tracking-wide md:text-3xl"
          : undefined
      }
      contentClassName="border-border-default bg-surface-modal-warm text-text-primary"
    >
      <div className="min-h-[calc(90vh-9rem)]">
      {loading && (
          <div className="flex h-full min-h-[calc(90vh-9rem)] items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <Text className="text-text-muted">Loading listing details...</Text>
            </div>
          </div>
        )}

        {error && (
          <div className="flex h-full min-h-[calc(90vh-9rem)] items-center justify-center py-12 text-center">
            <div>
            <Text className="text-status-error-fg mb-4">{error}</Text>
            <button
              onClick={onClose}
              className="text-brand-primary hover:text-brand-primary-hover underline"
            >
              Close
            </button>
            </div>
          </div>
        )}

        {!loading && !error && listing && (
          isOrganizerPerformance ? (
            <PerformanceOrganizerDetailContent
              listing={listing}
              typeLabel={typeLabel}
              sortedPhotos={sortedPhotos}
              childListings={childListings}
              organizerProgramPiecesDoc={organizerProgramPiecesDoc}
              showAllDates={showAllDates}
              onShowAllDatesChange={setShowAllDates}
              isAuthed={isAuthed}
              isSaved={isSaved}
              saving={saving}
              savingLoading={savingLoading}
              saveError={saveError}
              onToggleSave={() => {
                if (!saving && !savingLoading) {
                  void toggleSave()
                }
              }}
              onListingClick={navigateToListing}
              onSelectOrganizerPiece={setSelectedOrganizerPieceId}
              parentListingId={parentListingId}
              backToParentLabel={backToParentLabel}
            />
          ) : isOrganizerWorkshop ? (
            <WorkshopOrganizerDetailContent
              listing={listing}
              typeLabel={typeLabel}
              sortedPhotos={sortedPhotos}
              childListings={childListings}
              showAllDates={showAllDates}
              onShowAllDatesChange={setShowAllDates}
              isAuthed={isAuthed}
              isSaved={isSaved}
              saving={saving}
              savingLoading={savingLoading}
              saveError={saveError}
              onToggleSave={() => {
                if (!saving && !savingLoading) {
                  void toggleSave()
                }
              }}
              onListingClick={navigateToListing}
              parentListingId={parentListingId}
              backToParentLabel={backToParentLabel}
            />
          ) : isPiecePerformance ? (
            <PerformancePieceDetailContent
              listing={listing}
              typeLabel={typeLabel}
              sortedPhotos={sortedPhotos}
              showAllDates={showAllDates}
              onShowAllDatesChange={setShowAllDates}
              isAuthed={isAuthed}
              isSaved={isSaved}
              saving={saving}
              savingLoading={savingLoading}
              saveError={saveError}
              onToggleSave={() => {
                if (!saving && !savingLoading) {
                  void toggleSave()
                }
              }}
              onListingClick={navigateToListing}
              parentListingId={parentListingId}
              backToParentLabel={backToParentLabel}
            />
          ) : isClassDetail ? (
            <ClassDetailContent
              listing={listing}
              typeLabel={typeLabel}
              sortedPhotos={sortedPhotos}
              showAllDates={showAllDates}
              onShowAllDatesChange={setShowAllDates}
              isAuthed={isAuthed}
              isSaved={isSaved}
              saving={saving}
              savingLoading={savingLoading}
              saveError={saveError}
              onToggleSave={() => {
                if (!saving && !savingLoading) {
                  void toggleSave()
                }
              }}
              onListingClick={navigateToListing}
              parentListingId={parentListingId}
              backToParentLabel={backToParentLabel}
            />
          ) : isAuditionDetail ? (
            <AuditionDetailContent
              listing={listing}
              typeLabel={typeLabel}
              sortedPhotos={sortedPhotos}
              showAllDates={showAllDates}
              onShowAllDatesChange={setShowAllDates}
              isAuthed={isAuthed}
              isSaved={isSaved}
              saving={saving}
              savingLoading={savingLoading}
              saveError={saveError}
              onToggleSave={() => {
                if (!saving && !savingLoading) {
                  void toggleSave()
                }
              }}
              onListingClick={navigateToListing}
              parentListingId={parentListingId}
              backToParentLabel={backToParentLabel}
            />
          ) : isOpportunityDetail ? (
            <OpportunityDetailContent
              listing={listing}
              typeLabel={typeLabel}
              sortedPhotos={sortedPhotos}
              isAuthed={isAuthed}
              isSaved={isSaved}
              saving={saving}
              savingLoading={savingLoading}
              saveError={saveError}
              onToggleSave={() => {
                if (!saving && !savingLoading) {
                  void toggleSave()
                }
              }}
              onListingClick={navigateToListing}
              parentListingId={parentListingId}
              backToParentLabel={backToParentLabel}
            />
          ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-border-default">
              <div className="flex items-center gap-3">
                <Badge variant="primary" size="sm">{typeLabel}</Badge>
                {listing.company && (
                  <Text className="text-text-muted">{listing.company}</Text>
                )}
              </div>
              {isAuthed && (
                <div className="flex items-center gap-2">
                  {saveError && (
                    <Text className="text-status-error-fg">{saveError}</Text>
                  )}
                  <FavoriteButton
                    active={isSaved}
                    onToggle={() => {
                      if (!saving && !savingLoading) {
                        void toggleSave();
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
                  onClick={() => navigateToListing(parentListingId)}
                  className="text-sm text-brand-primary hover:text-brand-primary-hover underline"
                >
                  ← {backToParentLabel}
                </button>
              </div>
            )}

            {(() => {
              const hasTypeDetails = 
                (listing.type === "performance" && listing.performance_details) ||
                (listing.type === "class" && listing.class_workshop_details) ||
                (listing.type === "audition" && listing.audition_details) ||
                (listing.type === "creative" && listing.creative_details)
              
              if (!hasTypeDetails) return null
              
              return (
                <Card className="p-4">
                  <H3 className="mb-3 text-text-primary">Information</H3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-0">
                    {listing.type === "performance" && listing.performance_details && (
                      <>
                        {listing.performance_details.subtype === "PIECE" && listing.piece_details && (
                          <PieceDetails details={listing.piece_details} />
                        )}
                      </>
                    )}
                    {listing.type === "class" && listing.class_workshop_details && (
                      <>
                        {listing.class_workshop_details.class_workshop_type === "WORKSHOP" ? (
                          <WorkshopDetails details={listing.class_workshop_details} />
                        ) : (
                          <ClassDetails details={listing.class_workshop_details} />
                        )}
                      </>
                    )}
                    {listing.type === "audition" && listing.audition_details && (
                      <AuditionDetails details={listing.audition_details} />
                    )}
                    {listing.type === "creative" && listing.creative_details && (
                      <CreativeDetails details={listing.creative_details} />
                    )}
                  </div>
                </Card>
              )
            })()}

            {listingHasOccurrencesSectionContent(listing, opportunityDatesSummary) && (
              <Card className="p-4">
                <H3 className="mb-3 text-text-primary">Dates</H3>
                <ListingOccurrencesSection
                  listing={listing}
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
            listing.social_handles ||
            listing.notes ? (
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

                  {(listing.social_handles || listing.notes) && (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-0">
                      {listing.social_handles && (
                        <FieldRow
                          label="Social Media"
                          value={<SocialHandles socialHandles={listing.social_handles} />}
                        />
                      )}

                      {listing.notes && (
                        <FieldRow
                          label="Additional Information"
                          value={<p className="whitespace-pre-wrap">{listing.notes}</p>}
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
      parentListing={listing}
    />
    </>
  )
}
