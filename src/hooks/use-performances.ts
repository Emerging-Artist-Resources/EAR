import { useState, useCallback } from "react"
import { useSession } from "next-auth/react"

export interface Performance {
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
  user?: {
    name: string | null
    email: string
  }
  reviews?: Array<{
    id: string
    status: string
    comments: string | null
    reviewedAt: string
    reviewer: {
      name: string | null
    }
  }>
}

export function usePerformances(status?: string) {
  const [performances, setPerformances] = useState<Performance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPerformances = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = status 
        ? `/api/performances?status=${status}`
        : "/api/performances"
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error("Failed to fetch performances")
      }
      
      const data = await response.json()
      setPerformances(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [status])

  const submitPerformance = useCallback(async (data: any) => {
    try {
      const response = await fetch("/api/performances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit performance")
      }

      const result = await response.json()
      await fetchPerformances() // Refresh the list
      return result
    } catch (err) {
      throw err instanceof Error ? err : new Error("An error occurred")
    }
  }, [fetchPerformances])

  return {
    performances,
    loading,
    error,
    fetchPerformances,
    submitPerformance,
  }
}

export function useUserPerformances() {
  const { data: session } = useSession()
  const [performances, setPerformances] = useState<Performance[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUserPerformances = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      const response = await fetch(`/api/performances?userId=${session.user.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setPerformances(data)
      }
    } catch (error) {
      console.error("Error fetching user performances:", error)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  return {
    performances,
    loading,
    fetchUserPerformances,
  }
}
