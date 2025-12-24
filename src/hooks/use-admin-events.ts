import { useCallback, useEffect, useState } from "react"
import { AdminEventItem, AdminStatus } from "@/components/admin/events/types"

interface UseAdminEventsOptions {
  filter: AdminStatus
  dateFrom?: string
  dateTo?: string
}

export function useAdminEvents({ filter, dateFrom, dateTo }: UseAdminEventsOptions) {
  const [items, setItems] = useState<AdminEventItem[]>([])
  const [counts, setCounts] = useState<Record<"pending" | "approved" | "rejected", number>>({
    pending: 0,
    approved: 0,
    rejected: 0,
  })
  const [loading, setLoading] = useState(true)

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
    fetchEvents()
  }, [fetchEvents])

  return { items, counts, loading, refetch: fetchEvents }
}

