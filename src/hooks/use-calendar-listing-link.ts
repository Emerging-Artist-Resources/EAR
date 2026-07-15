"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import type { PublicListingDetail } from "@/components/calendar/PublicListingDetailSections"
import { ROUTES } from "@/lib/config/constants"
import { normalizePublicListingRelations } from "@/lib/listings/display"

function buildCalendarUrl(searchParams: URLSearchParams, listingId: string | null) {
  const params = new URLSearchParams(searchParams.toString())

  if (listingId) {
    params.set("listingId", listingId)
  } else {
    params.delete("listingId")
  }

  return params.toString() ? `${ROUTES.CALENDAR}?${params.toString()}` : ROUTES.CALENDAR
}

export function useCalendarListingLink() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    () => searchParams.get("listingId"),
  )
  const [prefetchedListing, setPrefetchedListing] = useState<PublicListingDetail | null>(null)
  const [prefetchError, setPrefetchError] = useState<string | null>(null)
  const [deepLinkReady, setDeepLinkReady] = useState(
    () => !searchParams.get("listingId"),
  )
  const initialDeepLinkIdRef = useRef(searchParams.get("listingId"))

  useEffect(() => {
    setSelectedListingId(searchParams.get("listingId"))
  }, [searchParams])

  useEffect(() => {
    const listingId = initialDeepLinkIdRef.current
    if (!listingId) {
      setDeepLinkReady(true)
      return
    }

    const abortController = new AbortController()
    let cancelled = false

    fetch(`/api/calendar/listing/${listingId}`, { signal: abortController.signal })
      .then(async (res) => {
        if (!res.ok) {
          const message = res.status === 404 ? "Listing not found" : "Failed to load listing"
          if (!cancelled) {
            setPrefetchError(message)
            setPrefetchedListing(null)
          }
          return null
        }
        const json = await res.json()
        return json.data as PublicListingDetail
      })
      .then((data) => {
        if (data == null || cancelled) return
        setPrefetchedListing(normalizePublicListingRelations(data))
        setPrefetchError(null)
      })
      .catch((err) => {
        if (err.name === "AbortError" || cancelled) return
        console.error("Error prefetching listing:", err)
        setPrefetchError("Failed to load listing")
        setPrefetchedListing(null)
      })
      .finally(() => {
        if (!cancelled) setDeepLinkReady(true)
      })

    return () => {
      cancelled = true
      abortController.abort()
    }
  }, [])

  const openListing = useCallback(
    (listingId: string) => {
      setPrefetchedListing((current) => (current?.id === listingId ? current : null))
      setPrefetchError(null)
      setSelectedListingId(listingId)
      router.replace(buildCalendarUrl(searchParams, listingId), { scroll: false })
    },
    [searchParams, router],
  )

  const closeListing = useCallback(() => {
    setSelectedListingId(null)
    setPrefetchedListing(null)
    setPrefetchError(null)
    router.replace(buildCalendarUrl(searchParams, null), { scroll: false })
  }, [searchParams, router])

  return {
    selectedListingId,
    openListing,
    closeListing,
    prefetchedListing,
    prefetchError,
    isDeepLinkPending: !deepLinkReady,
  }
}
