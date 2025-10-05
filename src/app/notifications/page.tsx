"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert } from "@/components/ui/alert"
import { NOTIFICATION_TYPE, getNotificationTypeColor, formatDateTime } from "@/lib/constants"

interface Notification {
  id: string
  title: string
  content: string
  type: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    
    fetchNotifications()
  }, [status])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications?active=true')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      } else {
        console.error("Failed to fetch notifications")
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
              <Header />

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Updates & Notifications
            </h2>
            <p className="text-gray-600">
              Stay informed about the latest updates and important announcements from the EAR team.
            </p>
          </div>

          {notifications.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5V3h0v14z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
                <p className="text-gray-500">
                  Check back later for updates and announcements.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card key={notification.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full mt-2 ${
                        notification.type === NOTIFICATION_TYPE.INFO ? 'bg-blue-500' :
                        notification.type === NOTIFICATION_TYPE.WARNING ? 'bg-yellow-500' :
                        notification.type === NOTIFICATION_TYPE.SUCCESS ? 'bg-green-500' :
                        notification.type === NOTIFICATION_TYPE.ERROR ? 'bg-red-500' :
                        'bg-gray-500'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <Badge variant={getNotificationTypeColor(notification.type)}>
                          {notification.type}
                        </Badge>
                      </div>
                      
                      <div className="prose prose-sm max-w-none text-gray-700 mb-4">
                        <p className="whitespace-pre-wrap">{notification.content}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          {formatDateTime(notification.createdAt)}
                        </span>
                        {notification.updatedAt !== notification.createdAt && (
                          <span>
                            • Updated {formatDateTime(notification.updatedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {session?.user?.role === "ADMIN" && (
            <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-900">
                    Admin Access
                  </h4>
                  <p className="text-sm text-blue-700">
                    You can manage notifications from the{" "}
                    <a 
                      href="/admin/notifications" 
                      className="font-medium underline hover:text-blue-800"
                    >
                      Admin Notifications page
                    </a>
                    .
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
