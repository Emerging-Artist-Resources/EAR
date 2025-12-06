"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { AdminProfileHeader } from "@/components/admin/AdminProfileHeader"
import { AdminProfileList } from "@/components/admin/AdminProfileList"
import { AdminProfileItem, ProfileStatus } from "@/components/admin/profile-types"
import { Card } from "@/components/ui/card"
import { Text } from "@/components/ui/typography"

export default function AdminProfilesPage() {
  const router = useRouter()
  const [authLoading, setAuthLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  const [filter, setFilter] = useState<ProfileStatus | "all">("all")
  const [items, setItems] = useState<AdminProfileItem[]>([])
  const [counts, setCounts] = useState<Record<"emerging" | "established", number>>({
    emerging: 0,
    established: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user
      if (!user) {
        router.push("/auth/signin")
        return
      }
      const role = (user.app_metadata as { role: string } | undefined)?.role ?? null
      setUserRole(role)
      if (role !== "ADMIN") {
        router.push("/dashboard")
        return
      }
      setAuthLoading(false)
    })
  }, [router])

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
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Jane Smith",
          email: "jane@example.com",
          status: "established",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "3",
          name: "Bob Johnson",
          email: "bob@example.com",
          status: "emerging",
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ]

      const emergingCount = mockProfiles.filter((p) => p.status === "emerging").length
      const establishedCount = mockProfiles.filter((p) => p.status === "established").length

      setCounts({ emerging: emergingCount, established: establishedCount })

      let filtered = mockProfiles
      if (filter !== "all") {
        filtered = mockProfiles.filter((p) => p.status === filter)
      }

      setItems(filtered)
    } catch (e) {
      console.error("Admin profiles fetch error:", e)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    if (authLoading || userRole !== "ADMIN") return
    fetchProfiles()
  }, [authLoading, userRole, fetchProfiles])

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

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-lg">Loading…</div>
    )
  }
  if (userRole !== "ADMIN") return null

  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <AdminProfileHeader filter={filter} counts={counts} onChange={setFilter} />
        {loading ? (
          <Card className="p-8 text-center">
            <Text className="text-[var(--gray-600)]">Loading…</Text>
          </Card>
        ) : (
          <AdminProfileList items={items} onUpdate={onUpdate} />
        )}
      </div>
    </div>
  )
}

