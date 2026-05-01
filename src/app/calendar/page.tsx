"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { subMonths, addMonths, startOfMonth, endOfMonth } from "date-fns"
import { CallToAction } from "@/components/layout/call-to-action"
import PerformanceModal from "@/components/performance-modal"
import { useCalendar } from "@/hooks/use-calendar"
import { useAuth } from "@/hooks/use-auth"
import { Calendar } from "@/components/calendar/calendar"
import { Text } from "@/components/ui/typography"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { HorizontalScrollCards } from "@/components/shared/HorizontalScrollCards"
import { ListingCard } from "@/components/shared/ListingCard"
import { ListingDetailsModal } from "@/components/calendar/ListingDetailsModal"
import Link from "next/link"
import { ROUTES } from "@/lib/constants"
import { RECENTLY_ADDED_MAX_AGE_DAYS } from "@/lib/recently-added-listings"
import CommunityCalendarHero from "@/components/calendar/CommunityCalendarHero"

function CalendarViewContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [recentListings, setRecentListings] = useState<Array<{
    id: string
    type: string
    title: string
    starts_at_utc: string | null
    ends_at_utc: string | null
    cover_image_url?: string | null
    cover_image_credit?: string | null
  }>>([])
  const { isAuthed } = useAuth()
  const { items, deadlines, loading, fetchCalendar } = useCalendar()

  // Handle listingId query parameter
  useEffect(() => {
    const listingId = searchParams.get("listingId")
    if (listingId) {
      setSelectedListingId(listingId)
    }
  }, [searchParams])

  const handleModalClose = useCallback(() => {
    setSelectedListingId(null)
    // Remove listingId from URL without page reload
    const params = new URLSearchParams(searchParams.toString())
    params.delete("listingId")
    const newUrl = params.toString() ? `/calendar?${params.toString()}` : "/calendar"
    router.replace(newUrl)
  }, [searchParams, router])

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

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <section className="shrink-0 bg-ear-black" aria-hidden>
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="h-[120px] lg:h-[200px]" />
          </div>
        </section>
        <div className="flex flex-1 items-center justify-center bg-surface-panel text-text-primary">
          <Text className="text-lg">Loading calendar...</Text>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <section className="relative w-full min-h-screen shrink-0 overflow-hidden bg-ear-black">
        <CommunityCalendarHero />
      </section>
      <div className="flex-1 bg-surface-panel text-text-primary">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className={`px-4 py-6 sm:px-0 transition-opacity duration-200 ${isModalOpen ? 'opacity-50' : ''}`}>
          <CallToAction onSubmitPerformance={handleOpenSubmit} />
          <Calendar items={items} deadlines={deadlines} />
          
          {recentListings.length > 0 && (
            <div className="mt-8">
              <Card className="p-6 shadow-md">
                <HorizontalScrollCards
                  title="Recently Added"
                  description={`Submitted in the last ${RECENTLY_ADDED_MAX_AGE_DAYS} days`}
                  cardsPerView={4}
                  onCardClick={(index) => {
                    const listing = recentListings[index]
                    if (listing) {
                      setSelectedListingId(listing.id)
                    }
                  }}
                >
                  {recentListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      id={listing.id}
                      type={listing.type}
                      title={listing.title}
                      starts_at_utc={listing.starts_at_utc}
                      ends_at_utc={listing.ends_at_utc}
                      coverImageUrl={listing.cover_image_url}
                      coverImageAlt={
                        listing.cover_image_credit
                          ? `Listing photo: ${listing.cover_image_credit}`
                          : `${listing.title} — photo`
                      }
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
      <Modal
        isOpen={authPromptOpen}
        onClose={() => setAuthPromptOpen(false)}
        title="Sign in required"
      >
        <div className="space-y-5">
          <Text className="text-sm text-text-muted">
            You must be signed in to submit a listing.
          </Text>
          <div className="flex justify-between">
            <Link href="/auth/signin?returnTo=/calendar">
              <Button variant="primary">Sign in</Button>
            </Link>
            <Link href={ROUTES.SIGN_UP}>
              <Button variant="outline">Create account</Button>
            </Link>
          </div>
        </div>
      </Modal>
      <ListingDetailsModal
        isOpen={selectedListingId !== null}
        onClose={handleModalClose}
        listingId={selectedListingId}
        onListingClick={setSelectedListingId}
      />
    </div>
  )
}

export default function CalendarView() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col">
        <section className="shrink-0 bg-ear-black" aria-hidden>
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="h-[120px] lg:h-[200px]" />
          </div>
        </section>
        <div className="flex flex-1 items-center justify-center bg-surface-panel text-text-primary">
          <Text className="text-lg">Loading calendar...</Text>
        </div>
      </div>
    }>
      <CalendarViewContent />
    </Suspense>
  )
}