import { useState, useCallback } from "react"
import { apiPost } from "@/lib/client/fetch-utils"

export interface ReviewData {
  eventId: string
  decision: "APPROVED" | "REJECTED"
  notes?: string | null
}

export interface ReviewResponse {
  id: string
  eventId: string
  decision: "APPROVED" | "REJECTED"
  notes: string | null
  reviewerUserId: string
  reviewedAt: string
}

export function useAdminReviews() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitReview = useCallback(async (reviewData: ReviewData) => {
    try {
      setLoading(true)
      setError(null)

      const result = await apiPost<ReviewResponse>("/api/admin/reviews", reviewData)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    submitReview,
  }
}
