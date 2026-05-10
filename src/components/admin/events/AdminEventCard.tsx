"use client"

import { useMemo, useState, useEffect } from "react"
import { AdminEventDetail, AdminEventItem } from "./types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  PerformanceDetails, 
  AuditionDetails, 
  CreativeDetails, 
  ClassDetails, 
  PieceDetails,
  SocialHandles 
} from "./EventDetailSections"
import { ReviewActions } from "./ReviewActions"
import { PhotoThumbnail } from "@/components/shared/PhotoThumbnail"
import { useAuth } from "@/hooks/use-auth"
import { formatOccurrenceRangeEST } from "@/lib/datetime-utils"

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null
  return (
    <div className="grid grid-cols-[200px_1fr] gap-4 items-start">
      <span className="text-[var(--gray-600)] font-medium">{label}</span>
      <div className="text-[var(--gray-800)]">{value}</div>
    </div>
  )
}

function getGoogleMapsLink(address: string | null | undefined, placeId: string | null | undefined): string | null {
  if (placeId) {
    return `https://www.google.com/maps/place/?q=place_id:${placeId}`
  }
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  }
  return null
}

export function AdminEventCard({
  item,
  onReview,
  onDelete,
  autoExpand = false,
  initialDetail,
}: {
  item: AdminEventItem
  onReview: (id: string, status: "APPROVED" | "REJECTED", comments: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  autoExpand?: boolean
  initialDetail?: AdminEventDetail | null
}) {
  const { role } = useAuth()
  const [expanded, setExpanded] = useState(autoExpand)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detail, setDetail] = useState<AdminEventDetail | null>(initialDetail ?? null)
  const [comments, setComments] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [photoReorderBusy, setPhotoReorderBusy] = useState(false)

  // Only admins and reviewers can download photos
  const canDownload = role === "ADMIN" || role === "REVIEWER"

  const reorderPhotos = async (photoIds: string[]) => {
    if (!detail || photoReorderBusy) return
    setPhotoReorderBusy(true)
    try {
      const res = await fetch(`/api/admin/photos/${item.id}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds }),
      })
      if (!res.ok) return
      const refreshed = await fetch(`/api/admin/events/${item.id}`)
      if (refreshed.ok) {
        const json = await refreshed.json()
        setDetail(json?.data ?? null)
      }
    } finally {
      setPhotoReorderBusy(false)
    }
  }

  const movePhoto = (sortedIndex: number, delta: number) => {
    const sorted = [...(detail?.listing_photos ?? [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    )
    const j = sortedIndex + delta
    if (j < 0 || j >= sorted.length) return
    const next = [...sorted]
    const tmp = next[sortedIndex]!
    next[sortedIndex] = next[j]!
    next[j] = tmp
    void reorderPhotos(next.map((p) => p.id))
  }

  const submittedAt = useMemo(
    () => new Date(item.submitted_at).toLocaleString(),
    [item.submitted_at]
  )

  const loadDetails = async () => {
    if (detail) {
      if (!autoExpand) setExpanded(!expanded)
      return
    }
    setLoadingDetail(true)
    const res = await fetch(`/api/admin/events/${item.id}`)
    setLoadingDetail(false)
    if (!res.ok) return
    const json = await res.json()
    setDetail(json?.data ?? null)
    setExpanded(true)
  }

  // Auto expand and prefetch details on mount if requested
  useEffect(() => {
    if (autoExpand && initialDetail && !expanded) {
      setExpanded(true)
    } else if (autoExpand && !detail && !loadingDetail) {
      loadDetails().catch(() => void 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoExpand, item.id, initialDetail])

  const approve = async () => {
    setSubmitting(true)
    await onReview(item.id, "APPROVED", comments)
    setSubmitting(false)
    setComments("")
  }
  const reject = async () => {
    setSubmitting(true)
    await onReview(item.id, "REJECTED", comments)
    setSubmitting(false)
    setComments("")
  }

  const handleDelete = async () => {
    if (!onDelete) return
    if (!confirm("Are you sure you want to remove this listing from the calendar? This action cannot be undone.")) {
      return
    }
    setDeleting(true)
    try {
      await onDelete(item.id)
    } finally {
      setDeleting(false)
    }
  }

  // choose a title for display if item.title is missing
  const computedTitle = (() => {
    if (item.title) return item.title
    
    if (detail?.type === "performance") {
      if (detail.performance_details?.subtype === "PIECE") {
        // For pieces: construct title from festival/parent event + piece info
        const parentEventName = detail.piece_details?.parent_event_name
        const parentListingTitle = detail.piece_details?.parent_listing_title
        const festivalName = parentListingTitle || parentEventName
        
        // Get piece title from piece_details table
        const pieceTitle = detail.piece_details?.piece_title || detail.piece_details?.piece_company || null
        
        if (festivalName && pieceTitle) {
          return `${festivalName} - ${pieceTitle}`
        } else if (festivalName) {
          return festivalName
        } else if (pieceTitle) {
          return pieceTitle
        } else {
          return "Untitled Piece"
        }
      } else {
        // ORGANIZER
        return detail.performance_details?.title ?? null
      }
    } else if (detail?.type === "audition") {
      return detail.audition_details?.title ?? null
    } else if (detail?.type === "creative") {
      return detail.creative_details?.title ?? null
    } else if (detail?.type === "class") {
      return detail.class_workshop_details?.title ?? null
    }
    
    return null
  })() ?? "Untitled"

  return (
    <Card className="p-5">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm">{item.type}</Badge>
            <Badge variant={item.status === "approved" ? "success" : item.status === "rejected" ? "error" : "warning"} size="sm">
              {item.status}
            </Badge>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-[var(--gray-900)]">{computedTitle}</h3>
          <p className="text-sm text-[var(--gray-600)]">Submitted: {submittedAt}</p>
          <div className="flex items-center gap-2 mt-2">
            {!autoExpand && (
              <Button variant="ghost" size="sm" onClick={loadDetails} className="px-1">
                {expanded ? "Hide details" : (loadingDetail ? "Loading…" : "View details")}
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={handleDelete}
                disabled={deleting || submitting}
                variant="outline"
                size="sm"
                className="border-[var(--error-600)] text-[var(--error-600)] hover:bg-[var(--error-50)]"
              >
                {deleting ? "Removing…" : "Remove from calendar"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* expanded details */}
      {expanded && detail && (
        <div className="mt-4 grid gap-6 bg-[var(--gray-50)] rounded-md p-4">
          {/* General info */}
          <section className="space-y-3">
            <h4 className="text-base font-bold text-[var(--gray-900)]">General</h4>
            <div className="space-y-2">
              <Row label="Contact" value={`${detail.contact_name ?? ""}${detail.pronouns ? ` (${detail.pronouns})` : ""}`} />
              <Row label="Email" value={detail.contact_email} />
              <Row label="Organization" value={
                detail.company ? (
                  detail.company_website ? <a className="underline text-[var(--primary-600)]" href={detail.company_website} target="_blank" rel="noopener noreferrer">{detail.company}</a> : detail.company
                ) : undefined
              }/>
              {detail.social_handles && <Row label="Social" value={<SocialHandles socialHandles={detail.social_handles} />} />}
              {detail.notes && <Row label="Additional Info" value={detail.notes} />}
            </div>
          </section>

          {/* Location and Event occurrences */}
          {(() => {
            // Check if all occurrences have the same location
            const hasSingleLocation = (() => {
              if (!detail.listing_occurrences || detail.listing_occurrences.length === 0) return false
              
              const firstOcc = detail.listing_occurrences[0]
              const firstLocation = {
                address: firstOcc.address || detail.address,
                place_id: firstOcc.place_id || detail.place_id,
                venue_name: firstOcc.venue_name || detail.venue_name,
              }
              
              return detail.listing_occurrences.every(occ => {
                const occLocation = {
                  address: occ.address || detail.address,
                  place_id: occ.place_id || detail.place_id,
                  venue_name: occ.venue_name || detail.venue_name,
                }
                return occLocation.address === firstLocation.address &&
                       occLocation.place_id === firstLocation.place_id &&
                       occLocation.venue_name === firstLocation.venue_name
              })
            })()

            const singleLocation = hasSingleLocation && detail.listing_occurrences?.[0] 
              ? {
                  address: detail.listing_occurrences[0].address || detail.address,
                  place_id: detail.listing_occurrences[0].place_id || detail.place_id,
                  venue_name: detail.listing_occurrences[0].venue_name || detail.venue_name,
                  location_instructions: detail.listing_occurrences[0].location_instructions || detail.location_instructions,
                }
              : null

            return (
              <>
                {/* Location - Single Location */}
                {hasSingleLocation && singleLocation && (singleLocation.address || singleLocation.venue_name) && (
                  <section className="space-y-3">
                    <h4 className="text-base font-bold text-[var(--gray-900)]">Location</h4>
                    <div className="space-y-2">
                      {singleLocation.address && (
                        <Row 
                          label="Address" 
                          value={
                            <div className="flex items-center gap-2">
                              <span>{singleLocation.address}</span>
                              {getGoogleMapsLink(singleLocation.address, singleLocation.place_id) && (
                                <a
                                  href={getGoogleMapsLink(singleLocation.address, singleLocation.place_id)!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[var(--primary-600)] hover:underline text-sm"
                                >
                                  View on Maps
                                </a>
                              )}
                            </div>
                          } 
                        />
                      )}
                      {singleLocation.venue_name && (
                        <Row label="Venue" value={singleLocation.venue_name} />
                      )}
                      {singleLocation.location_instructions && (
                        <Row label="Location Instructions" value={singleLocation.location_instructions} />
                      )}
                    </div>
                  </section>
                )}

                {/* Dates & Times */}
                <section className="space-y-3">
                  <h4 className="text-base font-bold text-[var(--gray-900)]">Dates & Times</h4>
                  {detail.listing_occurrences?.length ? (
                    (() => {
                      // Separate deadlines and events
                      const deadlines = detail.listing_occurrences.filter(o => o.occurrence_type === 'deadline')
                      const events = detail.listing_occurrences.filter(o => !o.occurrence_type || o.occurrence_type === 'event')
                      
                      // Get event type label
                      const eventTypeLabels: Record<string, string> = {
                        performance: "Performance",
                        audition: "Audition",
                        creative: "Creative",
                        class: "Class",
                      }
                      const eventTypeLabel = eventTypeLabels[detail.type] || "Event"
                      
                      const renderOccurrence = (o: NonNullable<AdminEventDetail['listing_occurrences']>[0]) => {
                        const occurrenceLocation = {
                          address: o.address || detail.address,
                          place_id: o.place_id || detail.place_id,
                          venue_name: o.venue_name || detail.venue_name,
                          location_instructions: o.location_instructions || detail.location_instructions,
                        }
                        const hasLocation = occurrenceLocation.address || occurrenceLocation.venue_name
                        
                        return (
                          <div key={o.id} className="border-l-2 border-[var(--gray-200)] pl-3 space-y-1">
                            <div className="text-sm font-medium text-[var(--gray-800)]">
                              {formatOccurrenceRangeEST(o.starts_at_utc, o.ends_at_utc)}
                            </div>
                            {!hasSingleLocation && hasLocation && (
                              <div className="ml-4 space-y-1 text-sm">
                                {occurrenceLocation.address && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[var(--gray-600)]">Address:</span>
                                    <span className="text-[var(--gray-800)]">{occurrenceLocation.address}</span>
                                    {getGoogleMapsLink(occurrenceLocation.address, occurrenceLocation.place_id) && (
                                      <a
                                        href={getGoogleMapsLink(occurrenceLocation.address, occurrenceLocation.place_id)!}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[var(--primary-600)] hover:underline text-xs"
                                      >
                                        View on Maps
                                      </a>
                                    )}
                                  </div>
                                )}
                                {occurrenceLocation.venue_name && (
                                  <div>
                                    <span className="text-[var(--gray-600)]">Venue: </span>
                                    <span className="text-[var(--gray-800)]">{occurrenceLocation.venue_name}</span>
                                  </div>
                                )}
                                {occurrenceLocation.location_instructions && (
                                  <div>
                                    <span className="text-[var(--gray-600)]">Instructions: </span>
                                    <span className="text-[var(--gray-800)]">{occurrenceLocation.location_instructions}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      }
                      
                      return (
                        <div className="space-y-4">
                          {/* Deadlines subsection */}
                          {deadlines.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-semibold text-[var(--gray-700)]">Deadlines</h5>
                              <div className="space-y-3">
                                {deadlines.map(renderOccurrence)}
                              </div>
                            </div>
                          )}
                          
                          {/* Event dates subsection */}
                          {events.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-semibold text-[var(--gray-700)]">{eventTypeLabel} Dates</h5>
                              <div className="space-y-3">
                                {events.map(renderOccurrence)}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()
                  ) : (
                    <p className="text-sm text-[var(--gray-600)]">No occurrences</p>
                  )}
                </section>
              </>
            )
          })()}

          {/* Photos */}
          <section className="space-y-2">
            <h4 className="text-base font-bold text-[var(--gray-900)]">Photos</h4>
            {detail.listing_photos?.length ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...detail.listing_photos]
                  .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                  .map((p: { id: string; path: string; credit?: string | null; sort_order?: number; url?: string | null }, index, arr) => {
                  const handleDownload = async (e: React.MouseEvent) => {
                    e.preventDefault()
                    if (!p.url) return

                    try {
                      const response = await fetch(p.url)
                      if (!response.ok) throw new Error('Failed to fetch image')
                      
                      const blob = await response.blob()
                      const blobUrl = URL.createObjectURL(blob)
                      const pathParts = p.path.split('.')
                      const ext = pathParts.length > 1 ? pathParts[pathParts.length - 1] : 'jpg'
                      const filename = `${item.id}-photo-${p.id}.${ext}`
                      
                      const link = document.createElement('a')
                      link.href = blobUrl
                      link.download = filename
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                      URL.revokeObjectURL(blobUrl)
                    } catch (error) {
                      console.error('Failed to download image:', error)
                      window.open(p.url, '_blank')
                    }
                  }

                  return (
                    <div key={p.id} className="space-y-1">
                      <PhotoThumbnail
                        photo={p}
                        onDownload={handleDownload}
                        showDownload={canDownload}
                      />
                      {canDownload && arr.length > 1 && (
                        <div className="flex gap-1 flex-wrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2"
                            disabled={photoReorderBusy || index === 0}
                            onClick={() => movePhoto(index, -1)}
                          >
                            Up
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2"
                            disabled={photoReorderBusy || index === arr.length - 1}
                            onClick={() => movePhoto(index, 1)}
                          >
                            Down
                          </Button>
                          {index === 0 && (
                            <span className="text-xs text-[var(--gray-600)] self-center ml-1">Cover</span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--gray-600)]">No photos</p>
            )}
          </section>

          {/* Type-specific details */}
          <section className="space-y-2">
            {detail.type === "performance" && detail.performance_details && (
              <PerformanceDetails details={detail.performance_details} fullDetail={detail} />
            )}
            {detail.piece_details && (
              <PieceDetails details={detail.piece_details} />
            )}
            {detail.type === "audition" && detail.audition_details && (
              <AuditionDetails details={detail.audition_details} />
            )}
            {detail.type === "creative" && detail.creative_details && (
              <CreativeDetails details={detail.creative_details} />
            )}
            {detail.type === "class" && detail.class_workshop_details && (
              <ClassDetails details={detail.class_workshop_details} />
            )}
          </section>

          {/* Review actions */}
          {item.status === "pending" && (
            <ReviewActions
              comments={comments}
              onCommentsChange={setComments}
              onApprove={approve}
              onReject={reject}
              submitting={submitting}
            />
          )}
        </div>
      )}
    </Card>
  )
}