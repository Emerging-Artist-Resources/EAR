"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import { AdminLayout } from "@/components/admin/shared/AdminLayout"
import { AdminProfileHeader } from "@/components/admin/profiles/AdminProfileHeader"
import { AdminProfileList } from "@/components/admin/profiles/AdminProfileList"
import { AdminLoadingState } from "@/components/admin/shared/AdminLoadingState"
import { AdminProfileItem, ProfileType, needsReview } from "@/components/admin/profiles/profile-types"
import { ProfileFilter } from "@/components/admin/profiles/AdminProfileHeader"

export default function AdminProfilesPage() {
  const [filter, setFilter] = useState<ProfileFilter>("all")
  const [profileTypeFilter, setProfileTypeFilter] = useState<ProfileType | "all">("all")
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
      // TODO: Replace with actual API call when backend is ready
      // const res = await fetch("/api/admin/profiles")
      // if (!res.ok) return
      // const json = await res.json()
      // const profiles = Array.isArray(json?.data) ? json.data as AdminProfileItem[] : []

      // Mock data for now - ready for backend integration
      const mockProfiles: AdminProfileItem[] = [
        {
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          status: "emerging",
          profileType: "individual",
          createdAt: new Date().toISOString(), // New user (within 72h)
        },
        {
          id: "2",
          name: "Jane Smith",
          email: "jane@example.com",
          status: "established",
          profileType: "company",
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          reviewedAt: new Date(Date.now() - 86400000).toISOString(), // Already reviewed
        },
        {
          id: "3",
          name: "Bob Johnson",
          email: "bob@example.com",
          status: "emerging",
          profileType: "individual",
          createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago - new user
        },
        {
          id: "4",
          name: "Alice Williams",
          email: "alice@example.com",
          status: "established",
          profileType: "festival",
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        },
        {
          id: "5",
          name: "Creative Arts Collective",
          email: "info@creativearts.org",
          status: "emerging",
          profileType: "company",
          createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago - new user
        },
        {
          id: "6",
          name: "Summer Music Festival",
          email: "contact@summerfest.com",
          status: "established",
          profileType: "festival",
          createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        },
        {
          id: "7",
          name: "Misc Organization",
          email: "contact@misc.org",
          status: "emerging",
          profileType: "other",
          createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago - new user
        },
      ]

      const emergingCount = mockProfiles.filter((p) => p.status === "emerging").length
      const establishedCount = mockProfiles.filter((p) => p.status === "established").length

      setCounts({ emerging: emergingCount, established: establishedCount })

      let filtered = mockProfiles
      
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

      setItems(filtered)
    } catch (e) {
      console.error("Admin profiles fetch error:", e)
    } finally {
      setLoading(false)
    }
  }, [filter, profileTypeFilter])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const onUpdate = useCallback(async (id: string, status: "emerging" | "established") => {
    try {
      // TODO: Replace with actual API call when backend is ready
      // const res = await fetch("/api/admin/profiles", {
      //   method: "PATCH",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ userId: id, status }),
      // })
      // if (!res.ok) {
      //   throw new Error("Failed to update profile")
      // }

      // Mock update for now
      setItems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p))
      )
      setCounts((prev) => {
        const updated = { ...prev }
        const oldProfile = items.find((p) => p.id === id)
        if (oldProfile) {
          updated[oldProfile.status] = Math.max(0, updated[oldProfile.status] - 1)
        }
        updated[status] = (updated[status] || 0) + 1
        return updated
      })
    } catch (error) {
      console.error("Failed to update profile:", error)
      throw error
    }
  }, [items])

  const onMarkReviewed = useCallback(async (id: string) => {
    try {
      // TODO: Replace with actual API call when backend is ready
      // const res = await fetch("/api/admin/profiles", {
      //   method: "PATCH",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ userId: id, reviewedAt: new Date().toISOString() }),
      // })
      // if (!res.ok) {
      //   throw new Error("Failed to mark as reviewed")
      // }

      // Mock update for now
      setItems((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, reviewedAt: new Date().toISOString() } : p
        )
      )
    } catch (error) {
      console.error("Failed to mark as reviewed:", error)
      throw error
    }
  }, [])

  return (
    <AdminLayout>
      <AdminProfileHeader
        filter={filter}
        profileTypeFilter={profileTypeFilter}
        counts={counts}
        newCount={newCount}
        onChange={setFilter}
        onProfileTypeChange={setProfileTypeFilter}
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

