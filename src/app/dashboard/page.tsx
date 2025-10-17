"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { formatDateTime } from "@/lib/constants"
import { getSupabaseClient } from "@/lib/supabase/client"
import Link from "next/link"

interface Performance {
  id: string
  title: string
  description: string | null
  date: string
  time: string | null
  location: string | null
  performer: string
  status: string
  createdAt: string
}

export default function Dashboard() {
  const router = useRouter()
  const [performances, setPerformances] = useState<Performance[]>([])
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user || null
      if (!user) {
        router.push("/auth/signin")
        return
      }
      setUserId(user.id)
      const name = (user as { user_metadata?: { name?: string; full_name?: string } })?.user_metadata?.name
        || (user as { user_metadata?: { name?: string; full_name?: string } })?.user_metadata?.full_name
        || user.email
      setUserName(name || null)
      setAuthLoading(false)
    })
  }, [router])

  const fetchUserPerformances = useCallback(async () => {
    if (!userId) return
    try {
      const response = await fetch("/api/me/performances")
      if (response.ok) {
        const data = await response.json()
        const items: Performance[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
        setPerformances(items)
      }
    } catch (error) {
      console.error("Error fetching performances:", error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (authLoading) return
    fetchUserPerformances()
  }, [authLoading, fetchUserPerformances])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!userId) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Your Submitted Performances
            </h2>
            <p className="text-gray-600">
              To submit a new performance, please visit the{" "}
              <Link href="/calendar" className="text-primary hover:opacity-80">
                Calendar page
              </Link>{" "}
              and use the submission form.
            </p>
          </div>

          <div className="bg-white shadow rounded-lg">
            {performances.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No performances submitted yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {performances.map((performance) => (
                  <div key={performance.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {performance.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {performance.performer} • {formatDateTime(performance.date, performance.time)}
                        </p>
                        {performance.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {performance.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          performance.status
                        )}`}
                      >
                        {performance.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
