"use client"

import { useState, useEffect, useMemo } from "react"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { PhotoThumbnail } from "@/components/shared/PhotoThumbnail"
import { formatDateTimeEST } from "@/lib/datetime-utils"
import type { PublicListingDetail } from "./PublicListingDetailSections"
import { getListingTitle } from "@/features/events/server/listing-utils"
import { HorizontalScrollCards } from "@/components/shared/HorizontalScrollCards"
import { ListingCard } from "@/components/shared/ListingCard"
import {
  PieceDetails,
  ClassDetails,
  PerformanceDetails,
  WorkshopDetails,
  AuditionDetails,
  CreativeDetails,
  SocialHandles,
  FieldRow,
} from "./PublicListingDetailSections"

function getGoogleMapsLink(address: string | null | undefined, placeId: string | null | undefined): string | null {
  if (placeId) {
    return `https://www.google.com/maps/place/?q=place_id:${placeId}`
  }
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  }
  return null
}


function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    performance: "Performance",
    audition: "Audition",
    creative: "Creative Opportunity",
    class: "Class/Workshop",
  }
  return labels[type] || type
}

function getOccurrenceLocation(
  occ: NonNullable<PublicListingDetail['listing_occurrences']>[number] | undefined,
  fallback: PublicListingDetail
) {
  if (!occ) return null
  return {
    address: occ.address || fallback.address,
    place_id: occ.place_id || fallback.place_id,
    venue_name: occ.venue_name || fallback.venue_name,
    location_instructions: occ.location_instructions || fallback.location_instructions,
  }
}

interface ListingDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  listingId: string | null
  onListingClick?: (listingId: string) => void
}

export function ListingDetailsModal({ isOpen, onClose, listingId, onListingClick }: ListingDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [listing, setListing] = useState<PublicListingDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAllDates, setShowAllDates] = useState(false)
  const [childListings, setChildListings] = useState<Array<{
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
    occurrences?: Array<{
      id: string
      starts_at_utc: string
      ends_at_utc: string | null
      tz: string
    }>
  }>>([])
  const [loadingChildren, setLoadingChildren] = useState(false)

  useEffect(() => {
    if (!isOpen || !listingId) {
      setListing(null)
      setError(null)
      setShowAllDates(false)
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
          setListing(data)
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
    setLoadingChildren(true)
    
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
          setLoadingChildren(false)
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        console.error("Error loading child listings:", err)
        if (!abortController.signal.aborted) {
          setChildListings([])
          setLoadingChildren(false)
        }
      })

    return () => {
      abortController.abort()
    }
  }, [isOpen, listingId])

  const title = listing ? getListingTitle(listing) : "Listing Details"
  const typeLabel = listing ? getTypeLabel(listing.type) : ""

  const { hasSingleLocation, singleLocation } = useMemo(() => {
    if (!listing?.listing_occurrences || listing.listing_occurrences.length === 0) {
      return { hasSingleLocation: false, singleLocation: null }
    }
    
    const firstLocation = getOccurrenceLocation(listing.listing_occurrences[0], listing)
    if (!firstLocation) {
      return { hasSingleLocation: false, singleLocation: null }
    }
    
    const allSame = listing.listing_occurrences.every(occ => {
      const occLocation = getOccurrenceLocation(occ, listing)
      if (!occLocation) return false
      return occLocation.address === firstLocation.address &&
             occLocation.place_id === firstLocation.place_id &&
             occLocation.venue_name === firstLocation.venue_name
    })
    
    return {
      hasSingleLocation: allSame,
      singleLocation: allSame ? firstLocation : null
    }
  }, [listing])

  const sortedPhotos = useMemo(() => {
    if (!listing?.listing_photos) return []
    return [...listing.listing_photos].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  }, [listing?.listing_photos])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      headerClassName="bg-primary"
    >
      {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Loading listing details...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="py-12 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="text-primary-600 hover:text-primary-700 underline"
            >
              Close
            </button>
          </div>
        )}

        {!loading && !error && listing && (
          <div className="space-y-4">
            {/* Header with type badge */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
              <Badge variant="primary" size="sm">{typeLabel}</Badge>
              {listing.company && (
                <span className="text-sm text-gray-600">{listing.company}</span>
              )}
            </div>

            {/* Info Card - Type-Specific Details */}
            {(() => {
              const hasTypeDetails = 
                (listing.type === "performance" && listing.performance_details) ||
                (listing.type === "class" && listing.class_workshop_details) ||
                (listing.type === "audition" && listing.audition_details) ||
                (listing.type === "creative" && listing.creative_details)
              
              if (!hasTypeDetails) return null
              
              return (
                <Card className="p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Information</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-0">
                    {listing.type === "performance" && listing.performance_details && (
                      <>
                        {listing.performance_details.subtype === "PIECE" && listing.piece_details && (
                          <PieceDetails details={listing.piece_details} />
                        )}
                        {listing.performance_details.subtype === "ORGANIZER" && (
                          <PerformanceDetails details={listing.performance_details} />
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

            {/* Dates Card - Location and Dates/Times */}
            {(hasSingleLocation && singleLocation && (singleLocation.address || singleLocation.venue_name)) || 
             (listing.listing_occurrences && listing.listing_occurrences.length > 0) ? (
              <Card className="p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Dates</h3>
                <div className="space-y-0">
                  {/* Location - Single Location */}
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
                                  className="text-primary-600 hover:text-primary-700 underline ml-2"
                                >
                                  View on Maps →
                                </a>
                              )}
                            </div>
                          } 
                        />
                      )}
                      {singleLocation.venue_name && (
                        <FieldRow label="Venue" value={singleLocation.venue_name} />
                      )}
                      {singleLocation.location_instructions && (
                        <FieldRow label="Location Instructions" value={singleLocation.location_instructions} />
                      )}
                    </div>
                  )}

                  {/* Dates & Times */}
                  {listing.listing_occurrences && listing.listing_occurrences.length > 0 && (
                    <div className="mt-4">
                {(() => {
                  const deadlines = listing.listing_occurrences
                    .filter(o => o.occurrence_type === 'deadline')
                    .sort((a, b) => new Date(a.starts_at_utc).getTime() - new Date(b.starts_at_utc).getTime())
                  const events = listing.listing_occurrences
                    .filter(o => !o.occurrence_type || o.occurrence_type === 'event')
                    .sort((a, b) => new Date(a.starts_at_utc).getTime() - new Date(b.starts_at_utc).getTime())
                  
                  const eventTypeLabel = getTypeLabel(listing.type)
                  
                  const renderOccurrence = (o: typeof listing.listing_occurrences[0]) => {
                    const occurrenceLocation = getOccurrenceLocation(o, listing)
                    const hasLocation = occurrenceLocation && (occurrenceLocation.address || occurrenceLocation.venue_name)
                    
                    return (
                      <div key={o.id} className="border-l-4 border-primary-300 pl-4 py-2 bg-white rounded-r">
                        <div className="text-sm font-semibold text-gray-900 mb-1">
                          {formatDateTimeEST(o.starts_at_utc)}
                          {o.ends_at_utc && ` - ${formatDateTimeEST(o.ends_at_utc)}`}
                        </div>
                        {!hasSingleLocation && hasLocation && occurrenceLocation && (
                          <div className="ml-0 mt-2 space-y-1 text-sm">
                            {occurrenceLocation.address && (
                              <div className="flex items-start gap-2">
                                <span className="text-gray-600 font-medium">Address:</span>
                                <div className="flex-1">
                                  <span className="text-gray-900">{occurrenceLocation.address}</span>
                                  {getGoogleMapsLink(occurrenceLocation.address, occurrenceLocation.place_id) && (
                                    <a
                                      href={getGoogleMapsLink(occurrenceLocation.address, occurrenceLocation.place_id)!}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary-600 hover:text-primary-700 underline text-xs ml-2"
                                    >
                                      View on Maps →
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                            {occurrenceLocation.venue_name && (
                              <div>
                                <span className="text-gray-600 font-medium">Venue: </span>
                                <span className="text-gray-900">{occurrenceLocation.venue_name}</span>
                              </div>
                            )}
                            {occurrenceLocation.location_instructions && (
                              <div>
                                <span className="text-gray-600 font-medium">Instructions: </span>
                                <span className="text-gray-900">{occurrenceLocation.location_instructions}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  }
                  
                  return (
                    <div className="space-y-4">
                      {deadlines.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Deadlines</h4>
                          <div className="space-y-2">
                            {deadlines.map(renderOccurrence)}
                          </div>
                        </div>
                      )}
                      {events.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">{eventTypeLabel} Dates</h4>
                          <div className="space-y-2">
                            {events.slice(0, showAllDates ? events.length : 3).map(renderOccurrence)}
                            {events.length > 3 && !showAllDates && (
                              <button
                                onClick={() => setShowAllDates(true)}
                                className="text-sm text-primary-600 hover:text-primary-700 underline mt-2"
                              >
                                See more ({events.length - 3} more)
                              </button>
                            )}
                            {events.length > 3 && showAllDates && (
                              <button
                                onClick={() => setShowAllDates(false)}
                                className="text-sm text-primary-600 hover:text-primary-700 underline mt-2"
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
              </Card>
            ) : null}

            {/* Contact Info Card 
            {(listing.contact_name || listing.contact_email) && (
              <Card className="p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-0">
                  {listing.contact_name && (
                    <FieldRow 
                      label="Contact Name" 
                      value={
                        <span>
                          {listing.contact_name}
                          {listing.pronouns && ` (${listing.pronouns})`}
                        </span>
                      } 
                    />
                  )}
                  {listing.contact_email && (
                    <FieldRow 
                      label="Contact Email" 
                      value={
                        <a 
                          href={`mailto:${listing.contact_email}`}
                          className="text-primary-600 hover:text-primary-700 underline"
                        >
                          {listing.contact_email}
                        </a>
                      } 
                    />
                  )}
                </div>
              </Card>
            )}*/}

            {/* Child Listings Card */}
            {childListings.length > 0 && (() => {
              const allPieces = childListings.every((child) => child.is_piece)
              const allClasses = childListings.every((child) => child.is_class)
              const title = allPieces 
                ? "Pieces in this Performance"
                : allClasses
                ? "Classes in this Workshop"
                : "Related Listings"
              
              return (
                <HorizontalScrollCards
                  title={title}
                  cardsPerView={3}
                  onCardClick={(index) => {
                    const childListing = childListings[index]
                    if (childListing && !childListing.is_piece && !childListing.is_class && onListingClick) {
                      onClose()
                      onListingClick(childListing.id)
                    }
                  }}
                >
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
                      onClick={child.is_piece || child.is_class ? undefined : () => {
                        if (onListingClick) {
                          onClose()
                          onListingClick(child.id)
                        }
                      }}
                    />
                  ))}
                </HorizontalScrollCards>
              )
            })()}

            {/* Additional Info Card - Photos, Social Media, Notes 
            {(sortedPhotos.length > 0) || 
             listing.social_handles || 
             listing.notes ? (
              <Card className="p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Additional Information</h3>
                <div className="space-y-0">
                  {sortedPhotos.length > 0 && (
                    <div className="py-2 col-span-2">
                      <div className="text-sm text-gray-600 mb-2">Photos:</div>
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
            ) : null}*/}
          </div>
        )}
    </Modal>
  )
}
