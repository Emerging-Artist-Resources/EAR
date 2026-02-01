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
import { formatDateTimeEST } from "@/lib/datetime-utils"

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null
  return (
    <div className="flex items-start gap-3">
      <span className="inline-block min-w-28 text-[var(--gray-500)]">{label}</span>
      <div className="text-[var(--gray-800)]">{value}</div>
    </div>
  )
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
  
  // Only admins and reviewers can download photos
  const canDownload = role === "ADMIN" || role === "REVIEWER"

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
  const computedTitle =
    item.title ??
    (detail?.type === "performance" ? detail?.performance_details?.title :
     detail?.type === "audition" ? detail?.audition_details?.title :
     detail?.type === "creative" ? detail?.creative_details?.title :
     detail?.type === "class" ? detail?.class_workshop_details?.title :
     null) ??
    "Untitled"

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
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-[var(--gray-700)]">General</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <Row label="Contact" value={`${detail.contact_name ?? ""}${detail.pronouns ? ` (${detail.pronouns})` : ""}`} />
              <Row label="Email" value={detail.contact_email} />
              <Row label="Organization" value={
                detail.company ? (
                  detail.company_website ? <a className="underline text-[var(--primary-600)]" href={detail.company_website} target="_blank">{detail.company}</a> : detail.company
                ) : undefined
              }/>
              <Row label="Address" value={detail.address} />
              <Row label="Venue" value={detail.venue_name} />
              <Row label="Location Instructions" value={detail.location_instructions} />
            </div>
            <Row label="Social" value={<SocialHandles socialHandles={detail.social_handles} />} />
            <Row label="Notes" value={detail.notes} />
          </section>

          {/* Event occurrences */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-[var(--gray-700)]">Dates & Times</h4>
            {detail.listing_occurrences?.length ? (
              <ul className="list-disc ml-5 text-sm">
                {detail.listing_occurrences.map((o) => (
                  <li key={o.id}>
                    {formatDateTimeEST(o.starts_at_utc)}
                    {o.ends_at_utc && ` - ${formatDateTimeEST(o.ends_at_utc)}`}
                    {o.occurrence_type && o.occurrence_type !== 'event' && (
                      <span className="text-[var(--gray-500)]"> ({o.occurrence_type})</span>
                    )}
                    {o.venue_name && (
                      <span className="text-[var(--gray-500)]"> - {o.venue_name}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--gray-600)]">No occurrences</p>
            )}
          </section>

          {/* Photos */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-[var(--gray-700)]">Photos</h4>
            {detail.listing_photos?.length ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {detail.listing_photos.map((p: { id: string; path: string; credit?: string | null; sort_order?: number; url?: string | null }) => {
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
                    <PhotoThumbnail
                      key={p.id}
                      photo={p}
                      onDownload={handleDownload}
                      showDownload={canDownload}
                    />
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--gray-600)]">No photos</p>
            )}
          </section>

          {/* Type-specific details */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-[var(--gray-700)]">Event Details</h4>
            {detail.type === "performance" && detail.performance_details && (
              <PerformanceDetails details={detail.performance_details} />
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

          {/* Meta */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-[var(--gray-700)]">Meta</h4>
            {detail.meta && Object.keys(detail.meta).length ? (
              <div className="grid gap-2">
                {Object.entries(detail.meta).map(([k, v]) => (
                  <Row key={k} label={k} value={typeof v === "object" ? JSON.stringify(v) : String(v)} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--gray-600)]">No meta</p>
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