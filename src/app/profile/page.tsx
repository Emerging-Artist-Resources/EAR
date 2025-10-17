"use client"

import { getSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/constants"

interface Performance {
  id: string
  title: string
  description: string | null
  date: string
  time: string | null
  location: string | null
  performer: string
  contactEmail: string | null
  contactPhone: string | null
  status: string
  createdAt: string
  reviews: Array<{
    id: string
    status: string
    comments: string | null
    reviewedAt: string
    reviewer: {
      name: string | null
    }
  }>
}

export default function UserProfile() {
  const supabase = getSupabaseClient()
  const router = useRouter()
  const [performances, setPerformances] = useState<Performance[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | undefined>(undefined)

  const fetchUserPerformances = useCallback(async () => {
    try {
      const response = await fetch(`/api/me/performances`)
      if (response.ok) {
        const json = await response.json()
        const items: Performance[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
            ? json.data
            : []
        setPerformances(items)
      } else {
        setPerformances([])
      }
    } catch (error) {
      console.error("Error fetching user performances:", error)
      setPerformances([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (!mounted) return
      const u = data.user as { id: string; email?: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null
      if (!u?.id) {
        router.push("/auth/signin")
        return
      }
      setUserId(u.id)
      setUserName((u.user_metadata?.name as unknown as string) ?? u.email ?? null)
      setUserEmail(u.email ?? null)
      const role = (u.app_metadata?.role as unknown) ?? (u.user_metadata?.role as unknown)
      setUserRole(typeof role === 'string' ? role : undefined)
      fetchUserPerformances()
    })()
    return () => { mounted = false }
  }, [supabase, router, fetchUserPerformances])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "warning"
      case "APPROVED":
        return "success"
      case "REJECTED":
        return "error"
      default:
        return "default"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Under Review"
      case "APPROVED":
        return "Approved"
      case "REJECTED":
        return "Rejected"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!userId) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
          </div>
          {/* Profile Header */}
          <div className="mb-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {userName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {userName}
                  </h2>
                  <p className="text-gray-600">{userEmail}</p>
                  <div className="mt-2">
                    <Badge variant={userRole === "ADMIN" ? "primary" : "default"}>
                      {userRole}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Statistics */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {performances.filter(p => p.status === "PENDING").length}
                  </div>
                  <div className="text-sm text-gray-600">Under Review</div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {performances.filter(p => p.status === "APPROVED").length}
                  </div>
                  <div className="text-sm text-gray-600">Approved</div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {performances.filter(p => p.status === "REJECTED").length}
                  </div>
                  <div className="text-sm text-gray-600">Rejected</div>
                </div>
              </Card>
            </div>
          </div>

          {/* Submitted Performances */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">My Submitted Performances</h3>
            {performances.length === 0 ? (
              <Card className="p-6">
                <div className="text-center text-gray-500">
                  <p className="text-lg mb-2">No performances submitted yet</p>
                  <p className="text-sm">
                    <Link href="/calendar" className="text-primary hover:opacity-80">
                      Submit your first performance
                    </Link>
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {performances.map((performance) => (
                  <Card key={performance.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            {performance.title}
                          </h4>
                          <Badge variant={getStatusColor(performance.status)}>
                            {getStatusText(performance.status)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <strong>Performer:</strong> {performance.performer}
                          </div>
                          <div>
                            <strong>Date:</strong> {formatDateTime(performance.date, performance.time)}
                          </div>
                          {performance.location && (
                            <div>
                              <strong>Location:</strong> {performance.location}
                            </div>
                          )}
                          <div>
                            <strong>Submitted:</strong> {new Date(performance.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {performance.description && (
                          <div className="mt-3">
                            <strong className="text-sm text-gray-700">Description:</strong>
                            <p className="text-sm text-gray-600 mt-1">{performance.description}</p>
                          </div>
                        )}

                        {/* Review Comments */}
                        {performance.reviews.length > 0 && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-md">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Admin Review:</h5>
                            {performance.reviews.map((review) => (
                              <div key={review.id} className="text-sm text-gray-600">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Badge variant={review.status === "APPROVED" ? "success" : "error"}>
                                    {review.status}
                                  </Badge>
                                  <span>by {review.reviewer.name} on {new Date(review.reviewedAt).toLocaleDateString()}</span>
                                </div>
                                {review.comments && (
                                  <p className="mt-1 italic">&ldquo;{review.comments}&rdquo;</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
