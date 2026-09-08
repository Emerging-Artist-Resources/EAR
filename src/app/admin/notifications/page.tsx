"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { H2, H3, Text } from "@/components/ui/typography"
import { formatDateTime } from "@/lib/config/constants"
import { AdminLayout } from "@/components/admin/shared/AdminLayout"
import { AdminLoadingState } from "@/components/admin/shared/AdminLoadingState"
import type {
  AdminAnnouncement,
  AnnouncementCtaKind,
  AnnouncementDashboardWidgetKind,
} from "@/features/announcements/types"

type FormState = {
  title: string
  content: string
  heroImageUrl: string
  ctaKind: "" | AnnouncementCtaKind
  ctaLabel: string
  ctaHref: string
  dashboardWidget: AnnouncementDashboardWidgetKind
  dashboardWidgetLabel: string
  dashboardWidgetValue: string
  popupEnabled: boolean
  popupHeadline: string
  popupBody: string
  popupCtaLabel: string
  popupShowAgain: boolean
  isActive: boolean
}

const emptyForm: FormState = {
  title: "",
  content: "",
  heroImageUrl: "",
  ctaKind: "",
  ctaLabel: "",
  ctaHref: "",
  dashboardWidget: "none",
  dashboardWidgetLabel: "",
  dashboardWidgetValue: "",
  popupEnabled: false,
  popupHeadline: "",
  popupBody: "",
  popupCtaLabel: "",
  popupShowAgain: false,
  isActive: true,
}

function formFromAnnouncement(a: AdminAnnouncement): FormState {
  return {
    title: a.title,
    content: a.content,
    heroImageUrl: a.heroImageUrl ?? "",
    ctaKind: a.cta?.kind ?? "",
    ctaLabel: a.cta?.label ?? "",
    ctaHref: a.cta?.href ?? "",
    dashboardWidget: a.dashboardWidget ?? "none",
    dashboardWidgetLabel: a.dashboardWidgetLabel ?? "",
    dashboardWidgetValue: a.dashboardWidgetValue ?? "",
    popupEnabled: a.popupEnabled ?? false,
    popupHeadline: a.popupHeadline ?? "",
    popupBody: a.popupBody ?? "",
    popupCtaLabel: a.popupCtaLabel ?? "",
    popupShowAgain: false,
    isActive: !a.archivedAt,
  }
}

function isDashboardWidgetOn(kind?: AnnouncementDashboardWidgetKind | null) {
  return kind === "member_code" || kind === "copyable_value"
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNotification, setEditingNotification] = useState<AdminAnnouncement | null>(null)
  const [formData, setFormData] = useState<FormState>(emptyForm)
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
      const payload: Record<string, unknown> = {
        title: formData.title,
        content: formData.content,
        isActive: formData.isActive,
        heroImageUrl: formData.heroImageUrl.trim() || undefined,
        ctaKind: formData.ctaKind || undefined,
        ctaLabel: formData.ctaKind ? formData.ctaLabel : undefined,
        ctaHref: formData.ctaKind ? formData.ctaHref : undefined,
      }
      if (isDashboardWidgetOn(formData.dashboardWidget) || isDashboardWidgetOn(editingNotification?.dashboardWidget)) {
        payload.dashboardWidget = formData.dashboardWidget
        payload.dashboardWidgetLabel = isDashboardWidgetOn(formData.dashboardWidget)
          ? formData.dashboardWidgetLabel
          : null
        payload.dashboardWidgetValue =
          formData.dashboardWidget === "copyable_value" ? formData.dashboardWidgetValue : null
      }
      payload.popupEnabled = formData.popupEnabled
      payload.popupHeadline = formData.popupHeadline.trim() || null
      payload.popupBody = formData.popupBody.trim() || null
      payload.popupCtaLabel = formData.popupCtaLabel.trim() || null
      if (formData.popupEnabled && formData.popupShowAgain) {
        payload.popupRevision = (editingNotification?.popupRevision ?? 1) + 1
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
    setFormData(emptyForm)
  }

  const handleCreateNew = () => {
    setEditingNotification(null)
    setFormData(emptyForm)
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
                      {notification.popupEnabled ? <Badge variant="primary">Popup</Badge> : null}
                    </div>
                    <Text className="text-sm text-gray-600 mb-2">{notification.content}</Text>
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
      >
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Announcement title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="URLs in the text become links automatically."
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hero image URL</label>
              <Input
                value={formData.heroImageUrl}
                onChange={(e) => setFormData({ ...formData, heroImageUrl: e.target.value })}
                placeholder="/images/workshop.jpg or https://…"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button</label>
              <Select
                value={formData.ctaKind}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ctaKind: (e.target as HTMLSelectElement).value as FormState["ctaKind"],
                  })
                }
                className="w-full"
              >
                <option value="">None</option>
                <option value="link">Link</option>
                <option value="authenticated_link">Sign-in required link</option>
              </Select>
            </div>

            {formData.ctaKind ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Button label</label>
                  <Input
                    value={formData.ctaLabel}
                    onChange={(e) => setFormData({ ...formData, ctaLabel: e.target.value })}
                    placeholder="Learn more"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Button link</label>
                  <Input
                    value={formData.ctaHref}
                    onChange={(e) => setFormData({ ...formData, ctaHref: e.target.value })}
                    placeholder="/profile?announcement=… or https://…"
                    required
                  />
                </div>
              </>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dashboard widget</label>
              <Select
                value={formData.dashboardWidget}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dashboardWidget: (e.target as HTMLSelectElement)
                      .value as AnnouncementDashboardWidgetKind,
                  })
                }
                className="w-full"
              >
                <option value="none">None</option>
                <option value="copyable_value">Copyable value (same for everyone)</option>
                <option value="member_code">Member code (standard vs fiscal)</option>
              </Select>
            </div>

            {isDashboardWidgetOn(formData.dashboardWidget) ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value label</label>
                <Input
                  value={formData.dashboardWidgetLabel}
                  onChange={(e) =>
                    setFormData({ ...formData, dashboardWidgetLabel: e.target.value })
                  }
                  placeholder="Your code"
                />
              </div>
            ) : null}

            {formData.dashboardWidget === "copyable_value" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <Input
                  value={formData.dashboardWidgetValue}
                  onChange={(e) =>
                    setFormData({ ...formData, dashboardWidgetValue: e.target.value })
                  }
                  placeholder="EAR-WORKSHOP"
                  required
                />
              </div>
            ) : null}

            <div className="flex items-center">
              <Checkbox
                id="popupEnabled"
                checked={formData.popupEnabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    popupEnabled: (e.target as HTMLInputElement).checked,
                  })
                }
              />
              <label htmlFor="popupEnabled" className="ml-2 block text-sm text-gray-900">
                Show as app popup
              </label>
            </div>
            <Text className="text-xs text-gray-500">
              First-visit popup on any app page. If more than one is enabled, the newest published
              announcement wins. If this announcement has a button (for example “Get your code”),
              that button also appears on the popup.
            </Text>

            {formData.popupEnabled ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Popup headline
                  </label>
                  <Input
                    value={formData.popupHeadline}
                    onChange={(e) => setFormData({ ...formData, popupHeadline: e.target.value })}
                    placeholder="Short headline"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Popup body</label>
                  <Textarea
                    value={formData.popupBody}
                    onChange={(e) => setFormData({ ...formData, popupBody: e.target.value })}
                    placeholder="One or two sentences. URLs become links automatically."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Popup button label
                  </label>
                  <Input
                    value={formData.popupCtaLabel}
                    onChange={(e) => setFormData({ ...formData, popupCtaLabel: e.target.value })}
                    placeholder="Learn more"
                  />
                  <Text className="mt-1 text-xs text-gray-500">
                    Secondary button on the popup. Goes to the announcement page.
                  </Text>
                </div>
                {editingNotification?.popupEnabled ? (
                  <div className="flex items-center">
                    <Checkbox
                      id="popupShowAgain"
                      checked={formData.popupShowAgain}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          popupShowAgain: (e.target as HTMLInputElement).checked,
                        })
                      }
                    />
                    <label htmlFor="popupShowAgain" className="ml-2 block text-sm text-gray-900">
                      Show again to people who dismissed this
                    </label>
                  </div>
                ) : null}
              </>
            ) : null}

            <div className="flex items-center">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: (e.target as HTMLInputElement).checked })
                }
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active (visible to users)
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Saving..." : editingNotification ? "Update" : "Create"}
              </Button>
              <Button type="button" variant="ghost" onClick={handleCloseModal} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </AdminLayout>
  )
}
