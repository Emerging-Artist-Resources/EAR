"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getNotificationTypeColor, formatDateTime } from "@/lib/constants"
import { getSupabaseClient } from "@/lib/supabase/client"

interface Notification {
  id: string
  title: string
  content: string
  type: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  author: {
    name: string | null
    email: string
  }
}

export default function AdminNotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "INFO",
    isActive: true
  })
  const [submitting, setSubmitting] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const getRoleFromUser = (user: unknown): string | null => {
    const u = user as { app_metadata?: { role?: string } } | null
    return u?.app_metadata?.role ?? null
  }

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user || null
      if (!user) {
        router.push("/auth/signin")
        return
      }
      const role = getRoleFromUser(user)
      setUserRole(role)
      if (role !== "ADMIN") {
        router.push("/dashboard")
        return
      }
      setAuthLoading(false)
    })
  }, [router])

  useEffect(() => {
    if (authLoading) return
    if (userRole !== "ADMIN") return
    fetchNotifications()
  }, [authLoading, userRole])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/announcements?admin=true')
      if (response.ok) {
        const data = await response.json()
        const raw = Array.isArray(data) ? data : data?.data ?? []
        type DbAnnouncement = {
          id: string
          title: string
          content: string
          type?: string | null
          archived_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          createdAt?: string | null
          updatedAt?: string | null
        }
        const items: Notification[] = (raw as DbAnnouncement[]).map((a) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          type: a.type ?? 'INFO',
          isActive: a.archived_at ? false : true,
          createdAt: a.created_at ?? a.createdAt ?? '',
          updatedAt: a.updated_at ?? a.updatedAt ?? a.created_at ?? '',
          author: { name: null, email: '' },
        }))
        setNotifications(items)
      } else {
        console.error("Failed to fetch notifications")
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingNotification 
        ? `/api/announcements/${editingNotification.id}`
        : '/api/announcements'
      
      const method = editingNotification ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchNotifications()
        handleCloseModal()
      } else {
        alert("Failed to save notification")
      }
    } catch (error) {
      console.error("Error saving notification:", error)
      alert("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) {
      return
    }

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchNotifications()
      } else {
        alert("Failed to delete notification")
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
      alert("An error occurred")
    }
  }

  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification)
    setFormData({
      title: notification.title,
      content: notification.content,
      type: notification.type,
      isActive: notification.isActive
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingNotification(null)
    setFormData({
      title: "",
      content: "",
      type: "INFO",
      isActive: true
    })
  }

  const handleCreateNew = () => {
    setEditingNotification(null)
    setFormData({
      title: "",
      content: "",
      type: "INFO",
      isActive: true
    })
    setIsModalOpen(true)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (userRole !== "ADMIN") {
    return null
  }

  console.log('notifications', notifications)
  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Manage Notifications
            </h2>
            <Button onClick={handleCreateNew}>
              Create New Notification
            </Button>
          </div>

          <Card className="p-6">
            {notifications.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No notifications created yet.
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          <Badge variant={getNotificationTypeColor(notification.type)}>
                            {notification.type}
                          </Badge>
                          {!notification.isActive && (
                            <Badge variant="default">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            Created by {notification.author?.name ?? 'Admin'} on {formatDateTime(notification.createdAt || notification.updatedAt)}
                          </span>
                          {notification.updatedAt !== notification.createdAt && (
                            <span>
                              Updated {formatDateTime(notification.updatedAt)}
                            </span>
                          )}
      </div>
    </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(notification)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={editingNotification ? "Edit Notification" : "Create New Notification"}
      >
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Notification title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Notification content"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="SUCCESS">Success</option>
                <option value="ERROR">Error</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active (visible to users)
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? "Saving..." : editingNotification ? "Update" : "Create"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseModal}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
}
