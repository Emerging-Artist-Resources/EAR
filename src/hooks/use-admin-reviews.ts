import { useState, useCallback } from "react"

export interface ReviewData {
  performanceId: string
  status: "APPROVED" | "REJECTED"
  comments?: string
}

export function useAdminReviews() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitReview = useCallback(async (reviewData: ReviewData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit review")
      }

      const result = await response.json()
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
