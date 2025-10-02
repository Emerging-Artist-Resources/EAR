"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { PERFORMANCE_STATUS, getStatusColor, formatDateTime } from "@/lib/constants"

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
  user: {
    name: string | null
    email: string
  }
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

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [performances, setPerformances] = useState<Performance[]>([])
  const [allPerformances, setAllPerformances] = useState<Performance[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("PENDING")

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (session.user.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }

    fetchPerformances()
  }, [session, status, router, filter])

  const fetchPerformances = async () => {
    try {
      // Fetch all performances to get accurate counts
      const response = await fetch('/api/performances')
      if (response.ok) {
        const data = await response.json()
        setAllPerformances(data)
        // Filter for the current tab
        const filteredData = data.filter((p: Performance) => p.status === filter)
        setPerformances(filteredData)
      }
    } catch (error) {
      console.error("Error fetching performances:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (performanceId: string, reviewStatus: string, comments: string) => {
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          performanceId,
          status: reviewStatus,
          comments,
        }),
      })

      if (response.ok) {
        // Refresh all performances and re-filter for current tab
        const allResponse = await fetch('/api/performances')
        if (allResponse.ok) {
          const allData = await allResponse.json()
          setAllPerformances(allData)
          const filteredData = allData.filter((p: Performance) => p.status === filter)
          setPerformances(filteredData)
        }
      } else {
        alert("Failed to submit review")
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      alert("An error occurred")
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session || session.user.role !== "ADMIN") {
    return null
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/calendar"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                View Calendar
              </Link>
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
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Performance Reviews
            </h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setFilter("PENDING")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === "PENDING"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Pending ({allPerformances.filter(p => p.status === "PENDING").length})
              </button>
              <button
                onClick={() => setFilter("APPROVED")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === "APPROVED"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Approved ({allPerformances.filter(p => p.status === "APPROVED").length})
              </button>
              <button
                onClick={() => setFilter("REJECTED")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === "REJECTED"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Rejected ({allPerformances.filter(p => p.status === "REJECTED").length})
              </button>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            {performances.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No performances found for the selected filter.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {performances.map((performance) => (
                  <PerformanceReviewCard
                    key={performance.id}
                    performance={performance}
                    onReview={handleReview}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PerformanceReviewCard({ 
  performance, 
  onReview 
}: { 
  performance: Performance
  onReview: (id: string, status: string, comments: string) => void 
}) {
  const [comments, setComments] = useState("")
  const [isReviewing, setIsReviewing] = useState(false)

  const handleSubmitReview = async (status: string) => {
    setIsReviewing(true)
    await onReview(performance.id, status, comments)
    setComments("")
    setIsReviewing(false)
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">
            {performance.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            <strong>Performer:</strong> {performance.performer}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Date:</strong> {formatDateTime(performance.date, performance.time)}
          </p>
          {performance.location && (
            <p className="text-sm text-gray-600">
              <strong>Location:</strong> {performance.location}
            </p>
          )}
          {performance.description && (
            <p className="text-sm text-gray-600 mt-2">
              <strong>Description:</strong> {performance.description}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            <strong>Submitted by:</strong> {performance.user ? `${performance.user.name} (${performance.user.email})` : "Anonymous"}
          </p>
          {(performance.contactEmail || performance.contactPhone) && (
            <p className="text-sm text-gray-500">
              <strong>Contact:</strong> {performance.contactEmail} {performance.contactPhone}
            </p>
          )}
          
          {performance.reviews.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700">Review History:</h4>
              {performance.reviews.map((review) => (
                <div key={review.id} className="mt-2 p-2 bg-gray-50 rounded">
                  <p className="text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      review.status === "APPROVED" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {review.status}
                    </span>
                    {" "}by {review.reviewer.name} on {new Date(review.reviewedAt).toLocaleDateString()}
                  </p>
                  {review.comments && (
                    <p className="text-sm text-gray-600 mt-1">{review.comments}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="ml-6">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            performance.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
            performance.status === "APPROVED" ? "bg-green-100 text-green-800" :
            "bg-red-100 text-red-800"
          }`}>
            {performance.status}
          </span>
        </div>
      </div>

      {performance.status === "PENDING" && (
        <div className="mt-6 border-t pt-6">
          <div className="mb-4">
            <label htmlFor={`comments-${performance.id}`} className="block text-sm font-medium text-gray-700">
              Review Comments (Optional)
            </label>
            <textarea
              id={`comments-${performance.id}`}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Add any comments about this performance..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => handleSubmitReview("APPROVED")}
              disabled={isReviewing}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isReviewing ? "Processing..." : "Approve"}
            </button>
            <button
              onClick={() => handleSubmitReview("REJECTED")}
              disabled={isReviewing}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isReviewing ? "Processing..." : "Reject"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
