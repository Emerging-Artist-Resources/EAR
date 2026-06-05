"use client"

import { useState, useCallback } from "react"
import { AdminLayout } from "@/components/admin/shared/AdminLayout"
import { AdminHeader } from "@/components/admin/events/AdminHeader"
import { AdminEventList } from "@/components/admin/events/AdminEventList"
import { AdminLoadingState } from "@/components/admin/shared/AdminLoadingState"
import { AdminListingDateBasis, AdminStatus } from "@/components/admin/events/types"
import { useAdminEvents } from "@/hooks/use-admin-events"

export default function AdminDashboardPage() {
  const [filter, setFilter] = useState<AdminStatus>("PENDING")
  const [dateFrom, setDateFrom] = useState<string | undefined>(undefined)
  const [dateTo, setDateTo] = useState<string | undefined>(undefined)
  const [dateBasis, setDateBasis] = useState<AdminListingDateBasis>("submitted")

  const { items, counts, loading, refetch } = useAdminEvents({
    filter,
    dateFrom,
    dateTo,
    dateBasis,
  })

  const handleReview = useCallback(
    async (id: string, status: "APPROVED" | "REJECTED", comments: string) => {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: id, decision: status, notes: comments }),
      })
      if (res.ok) {
        await refetch()
      } else {
        alert("Failed to submit review")
      }
    },
    [refetch]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/admin/events/${id}/delete`, {
        method: "POST",
      })
      if (res.ok) {
        await refetch()
      } else {
        alert("Failed to remove listing from calendar")
      }
    },
    [refetch]
  )

  return (
    <AdminLayout>
      <AdminHeader
        filter={filter}
        counts={counts}
        onChange={setFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        dateBasis={dateBasis}
        onChangeDate={({ from, to }) => {
          setDateFrom(from)
          setDateTo(to)
        }}
        onChangeDateBasis={setDateBasis}
      />
      {loading ? (
        <AdminLoadingState />
      ) : (
        <AdminEventList
          items={items}
          onReview={handleReview}
          onDelete={handleDelete}
          dateBasis={dateBasis}
        />
      )}
    </AdminLayout>
  )
}
