"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
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
  const { data: session, status } = useSession()
  const router = useRouter()
  const [performances, setPerformances] = useState<Performance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchUserPerformances()
  }, [session, status, router])

  const fetchUserPerformances = async () => {
    try {
      const response = await fetch(`/api/performances?userId=${session?.user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setPerformances(data)
      }
    } catch (error) {
      console.error("Error fetching user performances:", error)
    } finally {
      setLoading(false)
    }
  }

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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                My Profile
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/calendar"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                View Calendar
              </Link>
              {session.user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Admin Dashboard
                </Link>
              )}
              <span className="text-gray-700">Welcome, {session.user.name}</span>
              <button
                onClick={() => router.push("/api/auth/signout")}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Profile Header */}
          <div className="mb-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-indigo-600">
                      {session.user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {session.user.name}
                  </h2>
                  <p className="text-gray-600">{session.user.email}</p>
                  <div className="mt-2">
                    <Badge variant={session.user.role === "ADMIN" ? "primary" : "default"}>
                      {session.user.role}
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
                    <Link href="/calendar" className="text-indigo-600 hover:text-indigo-500">
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
                                  <p className="mt-1 italic">"{review.comments}"</p>
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
