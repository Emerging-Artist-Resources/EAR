"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { H1, H2, H3, Text } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import PerformanceModal from "@/components/performance-modal"
import { Modal } from "@/components/ui/modal"

type Announcement = {
  id: string
  title: string
  content: string
  type?: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR'
  published_at?: string | null
  created_at?: string | null
}

function typeVariant(type?: string) {
  switch (type) {
    case 'WARNING':
      return 'warning'
    case 'SUCCESS':
      return 'success'
    case 'ERROR':
      return 'error'
    default:
      return 'default'
  }
}

function formatDate(date: string | null | undefined): string {
  if (!date) return ''
  const now = new Date()
  const pubDate = new Date(date)
  const diffTime = Math.abs(now.getTime() - pubDate.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Posted today'
  if (diffDays === 1) return 'Posted 1 day ago'
  return `Posted ${diffDays} days ago`
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      setIsAuthed(Boolean(data?.user))
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session?.user))
    })

    fetch('/api/announcements')
      .then(res => res.json())
      .then(data => {
        setAnnouncements((data.data as Announcement[]) ?? [])
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching announcements:', error)
        setLoading(false)
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card className="mb-6" border="dashed" padding="lg">
            <div className="text-center">
              <H1>Emerging Artist Resources</H1>
              {/* className="text-4xl font-serif text-primary-700 mb-4
              TODO: Add a description of the website */}
              <div className="border-t border-primary-300 my-4"></div>
              <Text className="text-sm text-primary-600 mb-4">
                Supporting emerging artists with the tools they need to thrive.
              </Text>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  <H3>Latest Announcements</H3>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Text className="text-gray-500">Loading announcements...</Text>
                ) : announcements.length === 0 ? (
                  <Text className="text-gray-500">No announcements at this time.</Text>
                ) : (
                  <div className="space-y-4">
                    {announcements.slice(0, 3).map((a) => (
                      <div key={a.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                        <H3 className="mb-2">{a.title}</H3>
                        <Text className="mb-2 line-clamp-2">{a.content}</Text>
                        <div className="flex items-center justify-between">
                          <Text className="text-sm text-error-600">
                            {formatDate(a.published_at || a.created_at)}
                          </Text>
                          {a.type && (
                            <Badge variant={typeVariant(a.type)}>{a.type}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

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
                  <Button 
                    variant="secondary" 
                    className="w-full"
                  >
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

      <Modal
        isOpen={authPromptOpen}
        onClose={() => setAuthPromptOpen(false)}
        title="Sign in required"
      >
        <div className="space-y-5">
          <Text className="text-sm text-gray-700">
            You must be signed in to submit an event.
          </Text>
          <div className="flex justify-between">
            <Link href="/auth/signin?returnTo=/announcement">
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
