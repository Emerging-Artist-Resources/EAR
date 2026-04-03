"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import { AdminLayout } from "@/components/admin/shared/AdminLayout"
import { AdminProfileHeader } from "@/components/admin/profiles/AdminProfileHeader"
import { AdminProfileList } from "@/components/admin/profiles/AdminProfileList"
import { AdminLoadingState } from "@/components/admin/shared/AdminLoadingState"
import {
  AdminProfileItem,
  FiscalSponsorshipStatus,
  ProfileType,
  needsReview,
} from "@/components/admin/profiles/profile-types"
import { ProfileFilter } from "@/components/admin/profiles/AdminProfileHeader"

export default function AdminProfilesPage() {
  const [filter, setFilter] = useState<ProfileFilter>("all")
  const [profileTypeFilter, setProfileTypeFilter] = useState<ProfileType | "all">("all")
  const [fiscalFilter, setFiscalFilter] = useState<FiscalSponsorshipStatus | "all">("all")
  const [items, setItems] = useState<AdminProfileItem[]>([])
  const [counts, setCounts] = useState<Record<"emerging" | "established", number>>({
    emerging: 0,
    established: 0,
  })
  const [loading, setLoading] = useState(true)

  const newCount = useMemo(() => {
    return items.filter((p) => needsReview(p)).length
  }, [items])

  const fetchProfiles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/profiles")
      if (!res.ok) return
      const json = await res.json()
      const profiles = Array.isArray(json?.data) ? json.data as AdminProfileItem[] : []

      const emergingCount = profiles.filter((p) => p.status === "emerging").length
      const establishedCount = profiles.filter((p) => p.status === "established").length

      setCounts({ emerging: emergingCount, established: establishedCount })

      let filtered = profiles
      
      // Filter by status or needs review
      if (filter === "needsReview") {
        filtered = filtered.filter((p) => needsReview(p))
      } else if (filter !== "all") {
        filtered = filtered.filter((p) => p.status === filter)
      }
      
      // Filter by profile type
      if (profileTypeFilter !== "all") {
        filtered = filtered.filter((p) => p.profileType === profileTypeFilter)
      }

      if (fiscalFilter !== "all") {
        filtered = filtered.filter((p) => p.fiscalSponsorshipStatus === fiscalFilter)
      }

      setItems(filtered)
    } catch (e) {
      console.error("Admin profiles fetch error:", e)
    } finally {
      setLoading(false)
    }
  }, [filter, profileTypeFilter, fiscalFilter])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const onUpdate = useCallback(async (
    id: string,
    updates:
      | { status: "emerging" | "established" }
      | { fiscalSponsorshipStatus: FiscalSponsorshipStatus; fiscalSponsorshipNote?: string },
  ) => {
    try {
      const res = await fetch("/api/admin/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, ...updates }),
      })
      if (!res.ok) {
        throw new Error("Failed to update profile")
      }
      await fetchProfiles()
    } catch (error) {
      console.error("Failed to update profile:", error)
      throw error
    }
  }, [fetchProfiles])

  const onMarkReviewed = useCallback(async (id: string) => {
    try {
      const res = await fetch("/api/admin/profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, reviewedAt: true }),
      })
      if (!res.ok) {
        throw new Error("Failed to mark as reviewed")
      }
      await fetchProfiles()
    } catch (error) {
      console.error("Failed to mark as reviewed:", error)
      throw error
    }
  }, [fetchProfiles])

  return (
    <AdminLayout>
      <AdminProfileHeader
        filter={filter}
        profileTypeFilter={profileTypeFilter}
        counts={counts}
        newCount={newCount}
        onChange={setFilter}
        onProfileTypeChange={setProfileTypeFilter}
        fiscalFilter={fiscalFilter}
        onFiscalFilterChange={setFiscalFilter}
      />
      {loading ? (
        <AdminLoadingState />
      ) : (
        <AdminProfileList
          items={items}
          onUpdate={onUpdate}
          onMarkReviewed={onMarkReviewed}
        />
      )}
    </AdminLayout>
  )
}

