"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { AdminEventList } from "@/components/admin/AdminEventList"
import { AdminEventItem, AdminStatus } from "@/components/admin/types"
//import { AdminPagination } from "@/components/admin/AdminPagination"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [authLoading, setAuthLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  const [filter, setFilter] = useState<AdminStatus>("PENDING")
  const [items, setItems] = useState<AdminEventItem[]>([])
  const [counts, setCounts] = useState<Record<"pending"|"approved"|"rejected", number>>({
    pending: 0, approved: 0, rejected: 0
  })
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState<string | undefined>(undefined)
  const [dateTo, setDateTo] = useState<string | undefined>(undefined)

  // role check
  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user
      if (!user) { router.push("/auth/signin"); return }
      const role = (user.app_metadata as { role: string } | undefined)?.role ?? null
      setUserRole(role)
      if (role !== "ADMIN") { router.push("/dashboard"); return }
      setAuthLoading(false)
    })
  }, [router])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        fetch(`/api/admin/events?status=pending`),
        fetch(`/api/admin/events?status=approved`),
        fetch(`/api/admin/events?status=rejected`),
      ])

      const [p, a, r] = await Promise.all(
        [pendingRes, approvedRes, rejectedRes].map(async (res) => {
          if (!res.ok) return []
          const json = await res.json()
          return Array.isArray(json?.data) ? (json.data as AdminEventItem[]) : []
        })
      )

      setCounts({ pending: p.length, approved: a.length, rejected: r.length })
      let current = filter === "PENDING" ? p : filter === "APPROVED" ? a : r
      // date range filter on submitted_at
      if (dateFrom || dateTo) {
        const fromTime = dateFrom ? new Date(dateFrom).getTime() : -Infinity
        const toTime = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1 : Infinity
        current = current.filter((it) => {
          const t = new Date(it.submitted_at).getTime()
          return t >= fromTime && t <= toTime
        })
      }
      setItems(current)
    } catch (e) {
      console.error("Admin fetch error:", e)
    } finally {
      setLoading(false)
    }
  }, [filter, dateFrom, dateTo])

  useEffect(() => {
    if (authLoading || userRole !== "ADMIN") return
    fetchEvents()
  }, [authLoading, userRole, fetchEvents])

  const onReview = useCallback(async (id: string, status: "APPROVED" | "REJECTED", comments: string) => {
    const res = await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: id, decision: status, notes: comments }),
    })
    if (res.ok) await fetchEvents()
    else alert("Failed to submit review")
  }, [fetchEvents])

  if (authLoading) {
    return <div className="min-h-screen grid place-items-center text-lg">Loading…</div>
  }
  if (userRole !== "ADMIN") return null

  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <AdminHeader
          filter={filter}
          counts={counts}
          onChange={setFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChangeDate={({ from, to }) => {
            setDateFrom(from)
            setDateTo(to)
          }}
        />
        {loading
          ? <div className="p-8 text-center text-[var(--gray-600)]">Loading…</div>
          : <AdminEventList items={items} onReview={onReview} />
        }
      </div>
    </div>
  )
}
