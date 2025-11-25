"use client"

import { useState, useEffect, useCallback } from "react"
import { CallToAction } from "@/components/layout/call-to-action"
import PerformanceModal from "@/components/performance-modal"
import { useCalendar } from "@/hooks/use-calendar"
import { Calendar } from "@/components/calendar/calendar"
import { Text } from "@/components/ui/typography"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function CalendarView() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const { items, loading, fetchCalendar } = useCalendar()

  useEffect(() => {
    fetchCalendar({ limit: 500 })
  }, [fetchCalendar])

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      setIsAuthed(Boolean(data?.user))
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session?.user))
    })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  const handleModalSuccess = () => {
    fetchCalendar({ limit: 500 })
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
          <Calendar items={items} />
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
    </div>
  )
}