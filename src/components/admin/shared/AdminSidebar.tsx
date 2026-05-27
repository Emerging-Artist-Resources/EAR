"use client"

import { CollapsibleSidebar } from "@/components/shared/CollapsibleSidebar"
import { useAuth } from "@/hooks/use-auth"

const ADMIN_SIDEBAR_STORAGE_KEY = "admin-sidebar-collapsed"

const adminSections = [
  {
    items: [
      { name: "Analytics", href: "/admin/analytics" },
      { name: "Review Listings", href: "/admin", exact: true },
      { name: "Link Pieces", href: "/admin/pieces" },
      { name: "Link Classes", href: "/admin/classes" },
      { name: "Review Profiles", href: "/admin/profiles" },
      { name: "Manage Announcements", href: "/admin/notifications" },
    ],
  },
]

export function AdminSidebar() {
  const { role, isLoading } = useAuth()

  if (isLoading || role !== "ADMIN") {
    return null
  }

  return (
    <CollapsibleSidebar
      title="Admin Dashboard"
      storageKey={ADMIN_SIDEBAR_STORAGE_KEY}
      sections={adminSections}
    />
  )
}
