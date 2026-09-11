"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { H2, H3, Text } from "@/components/ui/typography"
import { formatDateTime } from "@/lib/config/constants"
import { AdminLayout } from "@/components/admin/shared/AdminLayout"
import { AdminLoadingState } from "@/components/admin/shared/AdminLoadingState"
import { AnnouncementMarkdown } from "@/components/announcements/AnnouncementMarkdown"
import {
  AnnouncementAdminForm,
  emptyAnnouncementForm,
  formFromAnnouncement,
  toAnnouncementSavePayload,
  type AnnouncementAdminFormState,
} from "@/components/admin/announcements/AnnouncementAdminForm"
import type { AdminAnnouncement } from "@/features/announcements/types"

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNotification, setEditingNotification] = useState<AdminAnnouncement | null>(null)
  const [formData, setFormData] = useState<AnnouncementAdminFormState>(emptyAnnouncementForm)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/announcements?admin=true")
      if (response.ok) {
        const data = await response.json()
        const raw = Array.isArray(data) ? data : data?.data ?? []
        setNotifications(raw as AdminAnnouncement[])
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
        : "/api/announcements"

      const method = editingNotification ? "PATCH" : "POST"
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(toAnnouncementSavePayload(formData, editingNotification)),
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
        method: "DELETE",
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

  const handleEdit = (notification: AdminAnnouncement) => {
    setEditingNotification(notification)
    setFormData(formFromAnnouncement(notification))
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingNotification(null)
    setFormData(emptyAnnouncementForm)
  }

  const handleCreateNew = () => {
    setEditingNotification(null)
    setFormData(emptyAnnouncementForm)
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <AdminLayout>
        <AdminLoadingState />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <H2>Manage Announcements</H2>
        <Button onClick={handleCreateNew}>Create New Announcement</Button>
      </div>

      <Card className="p-6">
        {notifications.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No announcements created yet.</div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <H3 className="text-gray-900">{notification.title}</H3>
                      {notification.archivedAt && <Badge variant="default">Inactive</Badge>}
                      {notification.dashboardWidget === "member_code" ? (
                        <Badge variant="primary">Member code</Badge>
                      ) : null}
                      {notification.dashboardWidget === "copyable_value" ? (
                        <Badge variant="primary">Dashboard value</Badge>
                      ) : null}
                      {notification.dashboardWidget === "message" ? (
                        <Badge variant="primary">Dashboard</Badge>
                      ) : null}
                      {notification.popupEnabled ? <Badge variant="primary">Popup</Badge> : null}
                    </div>
                    <div className="mb-2 text-sm text-gray-600">
                      <AnnouncementMarkdown
                        markdown={notification.content}
                        clampClassName="line-clamp-3"
                      />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <Text>
                        Created {formatDateTime(notification.createdAt || notification.publishedAt || "")}
                      </Text>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(notification)}>
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

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingNotification ? "Edit Announcement" : "Create New Announcement"}
        size="lg"
        closeOnOverlay={false}
      >
        <AnnouncementAdminForm
          formData={formData}
          onChange={setFormData}
          editing={editingNotification}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </AdminLayout>
  )
}
