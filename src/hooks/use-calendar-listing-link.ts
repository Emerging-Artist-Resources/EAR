"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ROUTES } from "@/lib/config/constants"

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
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)

  useEffect(() => {
    setSelectedListingId(searchParams.get("listingId"))
  }, [searchParams])

  const openListing = useCallback(
    (listingId: string) => {
      setSelectedListingId(listingId)
      router.replace(buildCalendarUrl(searchParams, listingId), { scroll: false })
    },
    [searchParams, router],
  )

  const closeListing = useCallback(() => {
    setSelectedListingId(null)
    router.replace(buildCalendarUrl(searchParams, null), { scroll: false })
  }, [searchParams, router])

  return { selectedListingId, openListing, closeListing }
}
