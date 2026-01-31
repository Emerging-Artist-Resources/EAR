"use client"

import { useMemo, useState, useEffect } from "react"
import { AdminEventDetail, AdminEventItem } from "./types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

function Label({ children }: { children: React.ReactNode }) {
  return <span className="inline-block min-w-28 text-[var(--gray-500)]">{children}</span>
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null
  return (
    <div className="flex items-start gap-3">
      <Label>{label}</Label>
      <div className="text-[var(--gray-800)]">{value}</div>
    </div>
  )
}

export function AdminEventCard({
  item,
  onReview,
  autoExpand = false,
  initialDetail,
}: {
  item: AdminEventItem
  onReview: (id: string, status: "APPROVED" | "REJECTED", comments: string) => Promise<void>
  autoExpand?: boolean
  initialDetail?: AdminEventDetail | null
}) {
  const [expanded, setExpanded] = useState(autoExpand)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detail, setDetail] = useState<AdminEventDetail | null>(initialDetail ?? null)
  const [comments, setComments] = useState("")
  const [submitting, setSubmitting] = useState(false)

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

  // choose a title for display if item.title is missing
  const computedTitle =
    item.title ??
    (detail?.type === "performance" ? detail?.performance_details?.show_name :
     detail?.type === "audition" ? detail?.audition_details?.audition_name :
     detail?.type === "creative" ? detail?.opportunity_details?.opportunity_name :
     detail?.type === "class" ? detail?.class_details?.class_name :
     detail?.funding_details?.title) ??
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
          {!autoExpand && (
            <Button variant="ghost" size="sm" onClick={loadDetails} className="mt-2 px-1">
              {expanded ? "Hide details" : (loadingDetail ? "Loading…" : "View details")}
            </Button>
          )}
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
                ) : detail.org_name ? (
                  detail.org_website ? <a className="underline text-[var(--primary-600)]" href={detail.org_website} target="_blank">{detail.org_name}</a> : detail.org_name
                ) : undefined
              }/>
              <Row label="Address" value={detail.address} />
              <Row label="Borough" value={detail.borough} />
            </div>
            <Row label="Social" value={
              detail.social_handles ? (() => {
                // Handle both string (TEXT) and object (legacy JSONB) formats
                let handles: Record<string, string> | null = null
                if (typeof detail.social_handles === 'string') {
                  try {
                    handles = JSON.parse(detail.social_handles)
                  } catch {
                    // If not valid JSON, treat as plain text
                    return <span className="text-sm">{detail.social_handles}</span>
                  }
                } else if (typeof detail.social_handles === 'object' && detail.social_handles !== null) {
                  handles = detail.social_handles as Record<string, string>
                }
                
                return handles ? (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(handles).map(([k,v]) => (
                      <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--gray-100)] text-xs">
                        <span className="uppercase">{k}</span>
                        <span className="text-[var(--gray-600)]">{String(v)}</span>
                      </span>
                    ))}
                  </div>
                ) : undefined
              })() : undefined
            }/>
            <Row label="Notes" value={detail.notes} />
          </section>

          {/* Event occurrences */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-[var(--gray-700)]">Dates & Times</h4>
            {(detail.listing_occurrences?.length || detail.event_occurrences?.length) ? (
              <ul className="list-disc ml-5 text-sm">
                {(detail.listing_occurrences || detail.event_occurrences || []).map((o: { id: string; starts_at_utc: string; tz: string; occurrence_type?: string }) => (
                  <li key={o.id}>
                    {new Date(o.starts_at_utc).toLocaleString()} 
                    {o.occurrence_type && o.occurrence_type !== 'event' && (
                      <span className="text-[var(--gray-500)]"> ({o.occurrence_type})</span>
                    )}
                    <span className="text-[var(--gray-500)]"> ({o.tz})</span>
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
                {detail.listing_photos.map((p: { id: string; path: string; credit?: string | null; sort_order?: number; url?: string | null }) => (
                  <div key={p.id} className="relative group">
                    {p.url ? (
                      <>
                        <img 
                          src={p.url} 
                          alt={p.credit || `Photo ${p.sort_order ?? 0}`}
                          className="w-full h-32 object-cover rounded border"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                          <a
                            href={p.url}
                            download={`${item.id}-photo-${p.id}.jpg`}
                            className="opacity-0 group-hover:opacity-100 text-white px-3 py-1 bg-[var(--primary-600)] rounded hover:bg-[var(--primary-500)]"
                            onClick={(e) => {
                              e.preventDefault()
                              // Force download
                              const link = document.createElement('a')
                              link.href = p.url!
                              link.download = `${item.id}-photo-${p.id}.jpg`
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                            }}
                          >
                            Download
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-32 bg-gray-200 rounded border flex items-center justify-center text-sm text-gray-500 p-2">
                        <span className="font-mono text-xs break-all">{p.path}</span>
                      </div>
                    )}
                    {p.credit && (
                      <p className="text-xs text-[var(--gray-600)] mt-1">{p.credit}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : detail.event_photos?.length ? (
              // Fallback for old event_photos field name
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {detail.event_photos.map((p: { id: string; path: string; credit?: string | null; sort_order?: number; url?: string | null }) => (
                  <div key={p.id} className="relative group">
                    {p.url ? (
                      <>
                        <img 
                          src={p.url} 
                          alt={p.credit || `Photo ${p.sort_order ?? 0}`}
                          className="w-full h-32 object-cover rounded border"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                          <a
                            href={p.url}
                            download={`${item.id}-photo-${p.id}.jpg`}
                            className="opacity-0 group-hover:opacity-100 text-white px-3 py-1 bg-[var(--primary-600)] rounded hover:bg-[var(--primary-500)]"
                            onClick={(e) => {
                              e.preventDefault()
                              const link = document.createElement('a')
                              link.href = p.url!
                              link.download = `${item.id}-photo-${p.id}.jpg`
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                            }}
                          >
                            Download
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-32 bg-gray-200 rounded border flex items-center justify-center text-sm text-gray-500 p-2">
                        <span className="font-mono text-xs break-all">{p.path}</span>
                      </div>
                    )}
                    {p.credit && (
                      <p className="text-xs text-[var(--gray-600)] mt-1">{p.credit}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--gray-600)]">No photos</p>
            )}
          </section>

          {/* Type-specific details */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-[var(--gray-700)]">Event Details</h4>
            {detail.type === "performance" && detail.performance_details && (
              <div className="grid gap-2">
                <Row label="Show name" value={detail.performance_details.show_name} />
                <Row label="Description" value={detail.performance_details.short_description} />
                <Row label="Credits" value={detail.performance_details.credit_info} />
                <Row label="Ticket link" value={
                  detail.performance_details.ticket_link ? <a className="underline text-[var(--primary-600)]" href={detail.performance_details.ticket_link} target="_blank">{detail.performance_details.ticket_link}</a> : undefined
                }/>
                {"ticket_price_cents" in detail.performance_details! && (
                  <Row label="Ticket price" value={
                    detail.performance_details?.ticket_price_cents != null
                      ? `$${(detail.performance_details.ticket_price_cents! / 100).toFixed(2)}`
                      : undefined
                  } />
                )}
                <Row label="Comp tickets" value={String(detail.performance_details.agree_comp_tickets)} />
              </div>
            )}
            {detail.type === "audition" && detail.audition_details && (
              <div className="grid gap-2">
                <Row label="Audition name" value={detail.audition_details.audition_name} />
                <Row label="About" value={detail.audition_details.about_project} />
                <Row label="Eligibility" value={detail.audition_details.eligibility} />
                <Row label="Compensation" value={detail.audition_details.compensation} />
                <Row label="Signup link" value={
                  detail.audition_details.audition_link ? <a className="underline text-[var(--primary-600)]" href={detail.audition_details.audition_link} target="_blank">{detail.audition_details.audition_link}</a> : undefined
                }/>
              </div>
            )}
            {detail.type === "creative" && detail.opportunity_details && (
              <div className="grid gap-2">
                <Row label="Opportunity" value={detail.opportunity_details.opportunity_name} />
                <Row label="Description" value={detail.opportunity_details.brief_description} />
                <Row label="Eligibility" value={detail.opportunity_details.eligibility} />
                <Row label="What’s offered" value={detail.opportunity_details.whats_offered} />
                <Row label="Stipend" value={detail.opportunity_details.stipend_amount} />
                <Row label="Requirements" value={detail.opportunity_details.requirements} />
                <Row label="Deadline" value={detail.opportunity_details.deadline ? new Date(detail.opportunity_details.deadline).toLocaleString() : undefined} />
                <Row label="Apply link" value={
                  detail.opportunity_details.apply_link ? <a className="underline text-[var(--primary-600)]" href={detail.opportunity_details.apply_link} target="_blank">{detail.opportunity_details.apply_link}</a> : undefined
                }/>
              </div>
            )}
            {detail.type === "class" && detail.class_details && (
              <div className="grid gap-2">
                <Row label="Class name" value={detail.class_details.class_name} />
                <Row label="Description" value={detail.class_details.description} />
                <Row label="Prices" value={
                  detail.class_details.prices?.length
                    ? <ul className="list-disc ml-5">{detail.class_details.prices.map((p,i)=>(
                        <li key={i}>
                          {(p.label ?? "General")}: {p.amount_cents != null ? `$${(p.amount_cents/100).toFixed(2)}` : "—"}
                        </li>
                      ))}</ul>
                    : "—"
                }/>
                <Row label="Recurrence" value={detail.class_details.rrule} />
                <Row label="Festival" value={
                  detail.class_details.festival_name ? (
                    detail.class_details.festival_link
                      ? <a className="underline text-[var(--primary-600)]" href={detail.class_details.festival_link} target="_blank">{detail.class_details.festival_name}</a>
                      : detail.class_details.festival_name
                  ) : undefined
                }/>
              </div>
            )}
            {detail.type === "funding" && detail.funding_details && (
              <div className="grid gap-2">
                <Row label="Title" value={detail.funding_details.title} />
                <Row label="Summary" value={detail.funding_details.summary} />
                <Row label="Link" value={
                  detail.funding_details.funding_link ? <a className="underline text-[var(--primary-600)]" href={detail.funding_details.funding_link} target="_blank">{detail.funding_details.funding_link}</a> : undefined
                }/>
              </div>
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
            <div className="pt-4 border-t border-[var(--gray-200)]">
              <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">Review comments (optional)</label>
              <textarea
                className="w-full rounded-md border border-[var(--gray-300)] p-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary-600)]"
                rows={3}
                placeholder="Add comments for the submitter…"
                value={comments}
                onChange={e => setComments(e.target.value)}
              />
              <div className="mt-3 flex gap-3">
                <Button
                  onClick={approve}
                  disabled={submitting}
                  className="bg-[var(--success-600)] hover:bg-[var(--success-500)]"
                >
                  {submitting ? "Processing…" : "Approve"}
                </Button>
                <Button
                  onClick={reject}
                  disabled={submitting}
                  className="bg-[var(--error-600)] hover:bg-[var(--error-500)]"
                >
                  {submitting ? "Processing…" : "Reject"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}