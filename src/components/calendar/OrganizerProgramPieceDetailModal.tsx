"use client"

import { useEffect, useMemo, useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { formatOccurrenceRangeEST } from "@/lib/datetime-utils"
import { getCalendarListingTypeLabel } from "@/lib/listing-type-labels"
import type { OrganizerProgramPiecePersisted } from "@/lib/organizer-program-pieces"
import {
  buildOccurrencesForOrganizerProgramPiece,
  organizerProgramPieceDisplayTitle,
  organizerProgramPiecePhotosForDisplay,
  organizerProgramPieceToPieceDetails,
} from "@/lib/organizer-program-pieces-display"
import type { PublicListingDetail } from "./PublicListingDetailSections"
import { FieldRow, PieceDetails } from "./PublicListingDetailSections"
import { PhotoThumbnail } from "@/components/shared/PhotoThumbnail"
import { H3, H4, Text } from "@/components/ui/typography"
import { getListingTitle } from "@/features/events/server/listing-utils"

function getGoogleMapsLink(address: string | null | undefined, placeId: string | null | undefined): string | null {
  if (placeId) {
    return `https://www.google.com/maps/place/?q=place_id:${placeId}`
  }
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  }
  return null
}

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
  }
}

export interface OrganizerProgramPieceDetailModalProps {
  isOpen: boolean
  onClose: () => void
  piece: OrganizerProgramPiecePersisted | null
  parentListing: PublicListingDetail | null
}

export function OrganizerProgramPieceDetailModal({
  isOpen,
  onClose,
  piece,
  parentListing,
}: OrganizerProgramPieceDetailModalProps) {
  const [showAllDates, setShowAllDates] = useState(false)

  useEffect(() => {
    if (!isOpen) setShowAllDates(false)
  }, [isOpen])

  const title = piece ? organizerProgramPieceDisplayTitle(piece) : "Program piece"
  const typeLabel = getCalendarListingTypeLabel("performance")
  const parentEventName = parentListing ? getListingTitle(parentListing) : null

  const pieceDetails = useMemo(
    () => (piece ? organizerProgramPieceToPieceDetails(piece, parentEventName) : null),
    [piece, parentEventName],
  )

  const occurrences = useMemo(() => {
    if (!piece || !parentListing?.listing_occurrences) return []
    return buildOccurrencesForOrganizerProgramPiece(piece, parentListing.listing_occurrences)
  }, [piece, parentListing?.listing_occurrences])

  const sortedPhotos = useMemo(
    () => (piece ? organizerProgramPiecePhotosForDisplay(piece) : []),
    [piece],
  )

  const { hasSingleLocation, singleLocation } = useMemo(() => {
    if (!parentListing?.listing_occurrences?.length) {
      return { hasSingleLocation: false, singleLocation: null }
    }

    const firstLocation = getOccurrenceLocation(parentListing.listing_occurrences[0], parentListing)
    if (!firstLocation) {
      return { hasSingleLocation: false, singleLocation: null }
    }

    const allSame = parentListing.listing_occurrences.every((occ) => {
      const occLocation = getOccurrenceLocation(occ, parentListing)
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
  }, [parentListing])

  const creditsNotes = piece?.credits?.trim() ? piece.credits.trim() : null

  if (!piece) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      headerClassName="bg-primary"
      contentClassName="border-border-default bg-surface-modal-warm text-text-primary"
      overlayClassName="z-[10050]"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border-default">
          <Badge variant="primary" size="sm">
            {typeLabel}
          </Badge>
        </div>

        <div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-brand-primary hover:text-brand-primary-hover underline"
          >
            ← Back to Performance
          </button>
        </div>

        {pieceDetails && (
          <Card className="p-4">
            <H3 className="mb-3 text-text-primary">Information</H3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-0">
              <PieceDetails details={pieceDetails} />
            </div>
          </Card>
        )}

        {((hasSingleLocation && singleLocation && (singleLocation.address || singleLocation.venue_name)) ||
          occurrences.length > 0) && (
          <Card className="p-4">
            <H3 className="mb-3 text-text-primary">Dates</H3>
            <div className="space-y-0">
              {hasSingleLocation && singleLocation && (singleLocation.address || singleLocation.venue_name) && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-0">
                  {singleLocation.address && (
                    <FieldRow
                      label="Location"
                      value={
                        <div>
                          <span>{singleLocation.address}</span>
                          {getGoogleMapsLink(singleLocation.address, singleLocation.place_id) && (
                            <a
                              href={getGoogleMapsLink(singleLocation.address, singleLocation.place_id)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-brand-primary hover:text-brand-primary-hover underline"
                            >
                              View on Maps →
                            </a>
                          )}
                        </div>
                      }
                    />
                  )}
                  {singleLocation.venue_name && <FieldRow label="Venue" value={singleLocation.venue_name} />}
                  {singleLocation.location_instructions && (
                    <FieldRow label="Location Instructions" value={singleLocation.location_instructions} />
                  )}
                </div>
              )}

              {occurrences.length > 0 && (
                <div className={hasSingleLocation ? "mt-4" : undefined}>
                  <H4 className="text-text-muted mb-2">{typeLabel} Dates</H4>
                  <div className="space-y-2">
                    {occurrences.slice(0, showAllDates ? occurrences.length : 3).map((o) => {
                      const parentOcc = parentListing?.listing_occurrences?.find((lo) => lo.id === o.id)
                      const occurrenceLocation = parentOcc
                        ? getOccurrenceLocation(parentOcc, parentListing!)
                        : hasSingleLocation
                          ? singleLocation
                          : null
                      const hasLocation =
                        occurrenceLocation && (occurrenceLocation.address || occurrenceLocation.venue_name)

                      return (
                        <div
                          key={o.id}
                          className="border-l-4 border-primary-300 pl-4 py-2 bg-surface-panel rounded-r"
                        >
                          <div className="font-header text-xl font-semibold text-text-primary mb-1">
                            {formatOccurrenceRangeEST(o.starts_at_utc, o.ends_at_utc)}
                          </div>
                          {!hasSingleLocation && hasLocation && occurrenceLocation && (
                            <div className="ml-0 mt-2 space-y-1 font-sans text-sm">
                              {occurrenceLocation.address && (
                                <div className="flex items-start gap-2">
                                  <span className="text-text-muted font-medium">Address:</span>
                                  <div className="flex-1">
                                    <span className="text-text-primary">{occurrenceLocation.address}</span>
                                    {getGoogleMapsLink(
                                      occurrenceLocation.address,
                                      occurrenceLocation.place_id,
                                    ) && (
                                      <a
                                        href={
                                          getGoogleMapsLink(
                                            occurrenceLocation.address,
                                            occurrenceLocation.place_id,
                                          )!
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-2 text-xs text-brand-primary hover:text-brand-primary-hover underline"
                                      >
                                        View on Maps →
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}
                              {occurrenceLocation.venue_name && (
                                <div>
                                  <span className="text-text-muted font-medium">Venue: </span>
                                  <span className="text-text-primary">{occurrenceLocation.venue_name}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {occurrences.length > 3 && !showAllDates && (
                      <button
                        type="button"
                        onClick={() => setShowAllDates(true)}
                        className="mt-2 text-sm text-brand-primary hover:text-brand-primary-hover underline"
                      >
                        See more ({occurrences.length - 3} more)
                      </button>
                    )}
                    {occurrences.length > 3 && showAllDates && (
                      <button
                        type="button"
                        onClick={() => setShowAllDates(false)}
                        className="mt-2 text-sm text-brand-primary hover:text-brand-primary-hover underline"
                      >
                        See less
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {(sortedPhotos.length > 0 || creditsNotes) && (
          <Card className="p-4">
            <H3 className="mb-3 text-text-primary">Additional Information</H3>
            <div className="space-y-0">
              {sortedPhotos.length > 0 && (
                <div className="py-2 col-span-2">
                  <Text className="text-text-muted mb-2">Photos</Text>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {sortedPhotos.map((photo) => (
                      <PhotoThumbnail key={photo.id} photo={photo} showDownload={false} />
                    ))}
                  </div>
                </div>
              )}
              {creditsNotes && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-0">
                  <FieldRow
                    label="Credits"
                    value={<p className="whitespace-pre-wrap">{creditsNotes}</p>}
                  />
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </Modal>
  )
}
