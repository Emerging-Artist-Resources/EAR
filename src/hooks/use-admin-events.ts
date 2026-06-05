import { useCallback, useEffect, useState } from "react"
import { AdminEventItem, AdminListingDateBasis, AdminStatus } from "@/components/admin/events/types"
import { useAuth } from "@/hooks/use-auth"

interface UseAdminEventsOptions {
  filter: AdminStatus
  dateFrom?: string
  dateTo?: string
  dateBasis?: AdminListingDateBasis
}

function buildEventsUrl(
  status: string,
  options: Pick<UseAdminEventsOptions, "dateFrom" | "dateTo" | "dateBasis">,
) {
  const params = new URLSearchParams({ status })
  if (options.dateFrom) params.set("dateFrom", options.dateFrom)
  if (options.dateTo) params.set("dateTo", options.dateTo)
  if (options.dateBasis && options.dateBasis !== "submitted") {
    params.set("dateBasis", options.dateBasis)
  }
  return `/api/admin/events?${params.toString()}`
}

export function useAdminEvents({
  filter,
  dateFrom,
  dateTo,
  dateBasis = "submitted",
}: UseAdminEventsOptions) {
  const { isAuthed } = useAuth()
  const [items, setItems] = useState<AdminEventItem[]>([])
  const [counts, setCounts] = useState<Record<"pending" | "approved" | "rejected", number>>({
    pending: 0,
    approved: 0,
    rejected: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchEvents = useCallback(async () => {
    if (!isAuthed) {
      setLoading(false)
      setItems([])
      setCounts({ pending: 0, approved: 0, rejected: 0 })
      return
    }

    setLoading(true)
    try {
      const dateOptions = { dateFrom, dateTo, dateBasis }
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        fetch(buildEventsUrl("pending", dateOptions)),
        fetch(buildEventsUrl("approved", dateOptions)),
        fetch(buildEventsUrl("rejected", dateOptions)),
      ])

      const [p, a, r] = await Promise.all(
        [pendingRes, approvedRes, rejectedRes].map(async (res) => {
          if (!res.ok) return []
          const json = await res.json()
          return Array.isArray(json?.data) ? (json.data as AdminEventItem[]) : []
        }),
      )

      setCounts({ pending: p.length, approved: a.length, rejected: r.length })
      const current = filter === "PENDING" ? p : filter === "APPROVED" ? a : r
      setItems(current)
    } catch (e) {
      console.error("Admin fetch error:", e)
    } finally {
      setLoading(false)
    }
  }, [filter, dateFrom, dateTo, dateBasis, isAuthed])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return { items, counts, loading, refetch: fetchEvents }
}
