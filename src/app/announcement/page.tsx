"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { H1, H3, Text } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import PerformanceModal from "@/components/performance-modal"
import { SignInRequiredModal } from "@/components/auth/SignInRequiredModal"
import { AnnouncementsList } from "@/components/announcements/AnnouncementsList"

export default function AnnouncementsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
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
    setIsModalOpen(false)
  }

  const handleOpenSubmit = () => {
    if (isAuthed) {
      setIsModalOpen(true)
    } else {
      setAuthPromptOpen(true)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card className="mb-6" border="dashed" padding="lg">
            <div className="text-center">
              <H1>Emerging Artist Resources</H1>
              <div className="border-t border-primary-300 my-4"></div>
              <Text className="text-sm text-primary-600 mb-4">
                Supporting emerging artists with the tools they need to thrive.
              </Text>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnnouncementsList limit={3} />

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <H3>Quick Actions</H3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/calendar" className="block">
                    <Button variant="primary" className="w-full">
                      View Calendar Events
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleOpenSubmit}
                  >
                    Submit an Event
                  </Button>
                  <Button variant="secondary" className="w-full">
                    Join Our Newsletter
                  </Button>
                </div>
              </CardContent>
            </Card>
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
        returnTo="/announcement"
        message="You must be signed in to submit an event."
      />
    </div>
  )
}
