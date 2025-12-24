import { useState, useCallback, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { apiGet, apiPost } from "@/lib/fetch-utils"

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
      
      const data = await apiGet<Performance[]>(url)
      setPerformances(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [status])

  const submitPerformance = useCallback(async (data: Record<string, unknown>) => {
    try {
      const result = await apiPost<Performance>("/api/performances", data)
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
  const [performances, setPerformances] = useState<Performance[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // Resolve user id once on mount
  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null)
    })
  }, [])

  const fetchUserPerformances = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      const data = await apiGet<Performance[]>(`/api/me/performances`)
      setPerformances(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching user performances:", error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  return {
    performances,
    loading,
    fetchUserPerformances,
  }
}
