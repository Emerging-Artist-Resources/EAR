"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { formatDateTime } from "@/lib/constants"

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
      const response = await fetch("/api/performances?userId=" + session?.user?.id)
      if (response.ok) {
        const data = await response.json()
        setPerformances(data)
      }
    } catch (error) {
      console.error("Error fetching performances:", error)
    } finally {
      setLoading(false)
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
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Performance Calendar
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
              Your Submitted Performances
            </h2>
            <p className="text-gray-600">
              To submit a new performance, please visit the{" "}
              <Link href="/calendar" className="text-indigo-600 hover:text-indigo-900">
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
