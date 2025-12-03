"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"

type AdminStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
interface AdminEventItem {
  id: string
  type: 'performance' | 'audition' | 'creative' | 'class' | 'funding'
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  title: string | null
}

export default function AdminDashboard() {
  const router = useRouter()
  const [items, setItems] = useState<AdminEventItem[]>([])
  const [counts, setCounts] = useState<Record<'pending'|'approved'|'rejected', number>>({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<AdminStatus>("PENDING")
  const [authLoading, setAuthLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const getRoleFromUser = (user: unknown): string | null => {
    const u = user as { app_metadata?: { role?: string } } | null
    return u?.app_metadata?.role ?? null
  }

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user || null
      if (!user) {
        router.push("/auth/signin")
        return
      }
      const role = getRoleFromUser(user)
      setUserRole(role)
      if (role !== "ADMIN") {
        router.push("/dashboard")
        return
      }
      setAuthLoading(false)
    })
  }, [router])

  const fetchEvents = useCallback(async () => {
    try {
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        fetch(`/api/admin/events?status=pending`),
        fetch(`/api/admin/events?status=approved`),
        fetch(`/api/admin/events?status=rejected`),
      ])
      const [pendingJson, approvedJson, rejectedJson] = await Promise.all([
        pendingRes.ok ? pendingRes.json() : { data: [] },
        approvedRes.ok ? approvedRes.json() : { data: [] },
        rejectedRes.ok ? rejectedRes.json() : { data: [] },
      ])
      const p = Array.isArray(pendingJson?.data) ? pendingJson.data as AdminEventItem[] : []
      console.log(p)
      const a = Array.isArray(approvedJson?.data) ? approvedJson.data as AdminEventItem[] : []
      const r = Array.isArray(rejectedJson?.data) ? rejectedJson.data as AdminEventItem[] : []
      setCounts({ pending: p.length, approved: a.length, rejected: r.length })

      const f = (filter === 'PENDING' ? 'pending' : filter === 'APPROVED' ? 'approved' : 'rejected')
      const current = f === 'pending' ? p : f === 'approved' ? a : r
      setItems(current)
    } catch (error) {
      console.error("Error fetching admin events:", error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    if (authLoading) return
    if (userRole !== "ADMIN") return
    fetchEvents()
  }, [authLoading, userRole, fetchEvents])

  

  const handleReview = async (performanceId: string, reviewStatus: string, comments: string) => {
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: performanceId,
          decision: reviewStatus,
          notes: comments,
        }),
      })

      if (response.ok) {
        await fetchEvents()
      } else {
        alert("Failed to submit review")
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      alert("An error occurred")
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (userRole !== "ADMIN") {
    return null
  }


  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Performance Reviews
            </h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setFilter("PENDING")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === "PENDING"
                    ? "bg-primary text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Pending ({counts.pending})
              </button>
              <button
                onClick={() => setFilter("APPROVED")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === "APPROVED"
                    ? "bg-primary text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Approved ({counts.approved})
              </button>
              <button
                onClick={() => setFilter("REJECTED")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === "REJECTED"
                    ? "bg-primary text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Rejected ({counts.rejected})
              </button>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            {items.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No performances found for the selected filter.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {items.map((performance) => (
                  <PerformanceReviewCard
                    key={performance.id}
                    performance={performance}
                    onReview={handleReview}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PerformanceReviewCard({ 
  performance, 
  onReview 
}: { 
  performance: AdminEventItem
  onReview: (id: string, status: string, comments: string) => void 
}) {
  const [comments, setComments] = useState("")
  const [isReviewing, setIsReviewing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  type AdminEventDetail = {
    id: string
    type: string
    status: string
    submitted_at: string
    contact_name?: string
    pronouns?: string | null
    contact_email?: string
    org_name?: string | null
    org_website?: string | null
    address?: string | null
    social_handles?: unknown
    notes?: string | null
    borough?: string | null
    meta?: unknown
    event_occurrences?: Array<{ id: string; starts_at_utc: string; tz: string }>
    event_photos?: Array<{ id: string; path: string; credit?: string | null }>
    performance_details?: {
      show_name?: string
      short_description?: string
      credit_info?: string
      ticket_link?: string
      ticket_price?: string
      agree_comp_tickets?: boolean
    }
  }
  const [details, setDetails] = useState<AdminEventDetail | null>(null)

  const loadDetails = async () => {
    if (details) { setExpanded(!expanded); return }
    const res = await fetch(`/api/admin/events/${performance.id}`)
    if (res.ok) {
      const json = await res.json()
      setDetails(json?.data ?? null)
      setExpanded(true)
    }
  }

  const handleSubmitReview = async (status: string) => {
    setIsReviewing(true)
    await onReview(performance.id, status, comments)
    setComments("")
    setIsReviewing(false)
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">{performance.title}</h3>
          <p className="text-sm text-gray-600">Submitted: {new Date(performance.submitted_at).toLocaleString()}</p>
          <button onClick={loadDetails} className="mt-2 text-sm text-primary underline">{expanded ? 'Hide details' : 'View details'}</button>

          {expanded && details && (
            <div className="mt-3 text-sm text-gray-700 space-y-2">
              <div><strong>Type:</strong> {details.type}</div>
              <div><strong>Status:</strong> {details.status}</div>
              <div><strong>Contact:</strong> {details.contact_name} {details.pronouns ? `(${details.pronouns})` : ''} — {details.contact_email}</div>
              {details.org_name && (<div><strong>Organization:</strong> {details.org_name} {details.org_website ? `(${details.org_website})` : ''}</div>)}
              {details.address && (<div><strong>Address:</strong> {details.address}</div>)}
              {details.borough && (<div><strong>Borough:</strong> {details.borough}</div>)}
              {details.notes && (<div><strong>Notes:</strong> {details.notes}</div>)}
              <div>
                <strong>Occurrences:</strong>
                <ul className="list-disc ml-5">
                  {(details.event_occurrences || []).map((o) => (
                    <li key={o.id}>{new Date(o.starts_at_utc).toLocaleString()} ({o.tz})</li>
                  ))}
                </ul>
              </div>
              {details.event_photos?.length ? (
                <div>
                  <strong>Photos:</strong>
                  <ul className="list-disc ml-5">
                    {details.event_photos.map((p) => (
                      <li key={p.id}>{p.path}{p.credit ? ` — ${p.credit}` : ''}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {details.type === 'performance' && details.performance_details && (
                <div className="mt-2">
                  <div><strong>Show name:</strong> {details.performance_details.show_name}</div>
                  <div><strong>Description:</strong> {details.performance_details.short_description}</div>
                  <div><strong>Credit info:</strong> {details.performance_details.credit_info}</div>
                  <div><strong>Ticket link:</strong> {details.performance_details.ticket_link}</div>
                  <div><strong>Ticket price:</strong> {details.performance_details.ticket_price}</div>
                  <div><strong>Agree comp tickets:</strong> {String(details.performance_details.agree_comp_tickets)}</div>
                </div>
              )}
            </div>
          )}
          
          {/* Optional: review history can be added later */}
        </div>
        
        <div className="ml-6">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            performance.status === "pending" ? "bg-yellow-100 text-yellow-800" :
            performance.status === "approved" ? "bg-green-100 text-green-800" :
            "bg-red-100 text-red-800"
          }`}>
            {performance.status}
          </span>
        </div>
      </div>

      {performance.status === "pending" && (
        <div className="mt-6 border-t pt-6">
          <div className="mb-4">
            <label htmlFor={`comments-${performance.id}`} className="block text-sm font-medium text-gray-700">
              Review Comments (Optional)
            </label>
            <textarea
              id={`comments-${performance.id}`}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Add any comments about this performance..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => handleSubmitReview("APPROVED")}
              disabled={isReviewing}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isReviewing ? "Processing..." : "Approve"}
            </button>
            <button
              onClick={() => handleSubmitReview("REJECTED")}
              disabled={isReviewing}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isReviewing ? "Processing..." : "Reject"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
