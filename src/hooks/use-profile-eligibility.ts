import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"
import { apiGet } from "@/lib/client/fetch-utils"

export interface ProfileEligibility {
  artistStatus: "emerging" | "established" | null
  isFirstSubmission: boolean
  isLoading: boolean
}

/**
 * Hook to get user's profile eligibility status
 * TODO: Implement isFirstSubmission check once events database is finalized
 * - Check if user has any approved/rejected events in the events table
 * - If they have submitted before (even if rejected), they've used their free token
 */
export function useProfileEligibility(): ProfileEligibility {
  const { user } = useAuth()
  const [artistStatus, setArtistStatus] = useState<"emerging" | "established" | null>(null)
  const [isFirstSubmission, setIsFirstSubmission] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    async function fetchEligibility() {
      try {
        // Fetch profile to get artist_status
        const profile = await apiGet<{ artist_status: string | null }>("/api/profile")
        const artistStatusValue = profile?.artist_status as "emerging" | "established" | null
        
        setArtistStatus(artistStatusValue)

        // TODO: Check if this is the user's first submission
        // This should query the events table to see if the user has any previous submissions
        // (including rejected ones, as rejected submissions still use the free token)
        // Example implementation:
        // const eventsResponse = await apiGet<Array<{ id: string }>>("/api/events/mine")
        // const hasSubmittedBefore = eventsResponse && eventsResponse.length > 0
        // setIsFirstSubmission(!hasSubmittedBefore)
        
        // For now, defaulting to true (first submission is free)
        setIsFirstSubmission(true)
      } catch (error) {
        console.error("Error fetching profile eligibility:", error)
        setArtistStatus(null)
        setIsFirstSubmission(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEligibility()
  }, [user?.id])

  return {
    artistStatus,
    isFirstSubmission,
    isLoading,
  }
}
