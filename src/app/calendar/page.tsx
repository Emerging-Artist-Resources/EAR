"use client"

import { useState, useEffect, useCallback } from "react"
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

export default function CalendarView() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [recentListings, setRecentListings] = useState<Array<{
    id: string
    type: string
    title: string
    starts_at_utc: string | null
    ends_at_utc: string | null
  }>>([])
  const [loadingRecent, setLoadingRecent] = useState(false)
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
    setLoadingRecent(true)
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
        setLoadingRecent(false)
      })
      .catch((err) => {
        console.error("Error loading recent listings:", err)
        setRecentListings([])
        setLoadingRecent(false)
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="text-lg">Loading calendar...</Text>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className={`px-4 py-6 sm:px-0 transition-opacity duration-200 ${isModalOpen ? 'opacity-50' : ''}`}>
          <CallToAction onSubmitPerformance={handleOpenSubmit} />
          <Calendar items={items} deadlines={deadlines} />
          
          {recentListings.length > 0 && (
            <div className="mt-8">
              <Card className="p-6 shadow-md">
                <HorizontalScrollCards
                  title="Recently Added"
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
                    />
                  ))}
                </HorizontalScrollCards>
              </Card>
            </div>
          )}
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
          <Text className="text-sm text-gray-700">
            You must be signed in to submit a listing.
          </Text>
          <div className="flex justify-between">
            <Link href="/auth/signin?returnTo=/calendar">
              <Button variant="primary">Sign in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="outline">Create account</Button>
            </Link>
          </div>
        </div>
      </Modal>
      <ListingDetailsModal
        isOpen={selectedListingId !== null}
        onClose={() => setSelectedListingId(null)}
        listingId={selectedListingId}
        onListingClick={setSelectedListingId}
      />
    </div>
  )
}