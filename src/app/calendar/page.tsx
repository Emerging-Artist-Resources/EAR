"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { subMonths, addMonths, startOfMonth, endOfMonth } from "date-fns"
import { CallToAction } from "@/components/layout/call-to-action"
import PerformanceModal from "@/components/performance-modal"
import { useCalendar } from "@/hooks/use-calendar"
import { useCalendarListingLink } from "@/hooks/use-calendar-listing-link"
import { useAuth } from "@/hooks/use-auth"
import { Calendar } from "@/components/calendar/calendar"
import { Text } from "@/components/ui/typography"
import { SignInRequiredModal } from "@/components/auth/SignInRequiredModal"
import { Card } from "@/components/ui/card"
import { HorizontalScrollCards } from "@/components/shared/HorizontalScrollCards"
import { ListingCard } from "@/components/shared/ListingCard"
import { ListingDetailsModal } from "@/components/calendar/ListingDetailsModal"
import type { ListingCardLinkDisplay, ListingCardVenue } from "@/lib/listings/card-display"
import CommunityCalendarHero from "@/components/calendar/CommunityCalendarHero"
import { PAGE_HERO_HEIGHT_CLASS } from "@/lib/marketing/page-hero"
import { cn } from "@/lib/utils"

function CalendarPageLoader() {
  return (
    <div className="flex min-h-screen flex-col">
      <section
        className={cn("shrink-0 bg-ear-black", PAGE_HERO_HEIGHT_CLASS)}
        aria-hidden
      />
      <div className="flex flex-1 items-center justify-center bg-surface-panel text-text-primary">
        <Text className="text-lg">Loading calendar...</Text>
      </div>
    </div>
  )
}

function CalendarViewContent() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const {
    selectedListingId,
    openListing,
    closeListing,
    prefetchedListing,
    prefetchError,
    isDeepLinkPending,
  } = useCalendarListingLink()
  const [recentListings, setRecentListings] = useState<Array<{
    id: string
    type: string
    title: string
    submitted_at: string
    host?: string | null
    description?: string | null
    venue?: ListingCardVenue | null
    price?: string | null
    link?: ListingCardLinkDisplay | null
    starts_at_utc: string | null
    ends_at_utc: string | null
    occurrences?: Array<{
      id: string
      starts_at_utc: string
      ends_at_utc: string | null
      tz: string
      occurrence_type?: string | null
    }>
  }>>([])
  const { isAuthed } = useAuth()
  const { items, deadlines, loading, fetchCalendar } = useCalendar()

  useEffect(() => {
    const now = new Date()
    const from = startOfMonth(subMonths(now, 3)).toISOString()
    const to = endOfMonth(addMonths(now, 3)).toISOString()
    fetchCalendar({ 
      from,
      to,
      limit: 500 
    })
  }, [fetchCalendar])

  useEffect(() => {
    fetch("/api/calendar/recent?limit=12")
      .then(async (res) => {
        if (!res.ok) {
          return []
        }
        const json = await res.json()
        return json.data || []
      })
      .then((data) => {
        setRecentListings(data)
      })
      .catch((err) => {
        console.error("Error loading recent listings:", err)
        setRecentListings([])
      })
  }, [])

  const handleModalSuccess = () => {
    const now = new Date()
    const from = startOfMonth(subMonths(now, 3)).toISOString()
    const to = endOfMonth(addMonths(now, 3)).toISOString()
    fetchCalendar({ 
      from,
      to,
      limit: 500 
    })
  }

  const handleOpenSubmit = useCallback(() => {
    if (isAuthed) {
      setIsModalOpen(true)
    } else {
      setAuthPromptOpen(true)
    }
  }, [isAuthed])

  // Hold a single loader until calendar + deep-link prefetch are both ready.
  if (loading || isDeepLinkPending) {
    return <CalendarPageLoader />
  }

  const hydratedListing =
    prefetchedListing && selectedListingId && prefetchedListing.id === selectedListingId
      ? prefetchedListing
      : null
  const hydratedError =
    !hydratedListing && selectedListingId && prefetchError ? prefetchError : null

  return (
    <div className="flex min-h-screen flex-col">
      <CommunityCalendarHero />
      <div className="flex-1 bg-surface-panel text-text-primary">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div
            className={`calendar-chrome px-4 py-6 sm:px-0 transition-opacity duration-200 ${isModalOpen ? "opacity-50" : ""}`}
          >
            <CallToAction onSubmitPerformance={handleOpenSubmit} />
            <Calendar
              items={items}
              deadlines={deadlines}
              onListingSelect={openListing}
            />

            {recentListings.length > 0 && (
              <div className="mt-8">
                <Card className="p-6 shadow-md">
                  <HorizontalScrollCards
                    title="Recently Added"
                    cardsPerView={4}
                    onCardClick={(index) => {
                      const listing = recentListings[index]
                      if (listing) {
                        openListing(listing.id)
                      }
                    }}
                  >
                    {recentListings.map((listing) => (
                      <ListingCard
                        key={listing.id}
                        id={listing.id}
                        type={listing.type}
                        title={listing.title}
                        host={listing.host}
                        description={listing.description}
                        venue={listing.venue}
                        price={listing.price}
                        link={listing.link}
                        submittedAt={listing.submitted_at}
                        starts_at_utc={listing.starts_at_utc}
                        ends_at_utc={listing.ends_at_utc}
                        occurrences={listing.occurrences}
                        onClick={() => openListing(listing.id)}
                      />
                    ))}
                  </HorizontalScrollCards>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
      <PerformanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
      <SignInRequiredModal
        isOpen={authPromptOpen}
        onClose={() => setAuthPromptOpen(false)}
        returnTo="/calendar"
        message="You must be signed in to submit a listing."
      />
      <ListingDetailsModal
        isOpen={selectedListingId !== null}
        onClose={closeListing}
        listingId={selectedListingId}
        onListingClick={openListing}
        initialListing={hydratedListing}
        initialError={hydratedError}
      />
    </div>
  )
}

export default function CalendarView() {
  return (
    <Suspense fallback={<CalendarPageLoader />}>
      <CalendarViewContent />
    </Suspense>
  )
}
