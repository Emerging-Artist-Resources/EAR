"use client"

import { AdminProfileItem, isNewProfile } from "./profile-types"
import { Card } from "@/components/ui/card"
import { Text } from "@/components/ui/typography"
import { Badge } from "@/components/ui/badge"
import { AdminProfileCard } from "./AdminProfileCard"
import { ADMIN_LIGHT_SURFACE } from "@/components/admin/shared/admin-light-surface"

export function AdminProfileList({
  items,
  onUpdate,
}: {
  items: AdminProfileItem[]
  onUpdate: (
    id: string,
    updates:
      | { status: "emerging" | "established" }
      | {
          fiscalSponsorshipStatus: "none" | "pending" | "approved" | "paused" | "revoked"
          fiscalSponsorshipNote?: string
        },
  ) => Promise<void>
}) {
  if (!items.length) {
    return (
      <Card className="p-8 text-center">
        <Text className="text-[var(--gray-600)]">No profiles found.</Text>
      </Card>
    )
  }

  return (
    <div
      className={`overflow-x-auto rounded-md border border-[var(--gray-200)] ${ADMIN_LIGHT_SURFACE}`}
    >
      <table className="min-w-full text-sm">
        <thead className="bg-[var(--gray-50)] text-[var(--gray-700)]">
          <tr>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2 text-left">Email</th>
            <th className="px-3 py-2 text-left">Type</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Fiscal Sponsorship</th>
            <th className="px-3 py-2 text-left">Created</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((profile) => {
            const created = new Date(profile.createdAt).toLocaleString()
            const isNew = isNewProfile(profile)
            const isReviewed = !!profile.reviewedAt
            
            return (
              <tr
                key={profile.id}
                className={`border-t border-[var(--gray-200)] ${
                  isNew && !isReviewed ? "bg-[var(--warning-50)]" : ""
                }`}
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {profile.name || "—"}
                    {isNew && !isReviewed && (
                      <Badge variant="warning" size="sm">New</Badge>
                    )}
                    {isReviewed && (
                      <Badge variant="success" size="sm">Reviewed</Badge>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">{profile.email || "—"}</td>
                <td className="px-3 py-2 capitalize">{profile.profileType || "—"}</td>
                <td className="px-3 py-2 capitalize">{profile.status}</td>
                <td className="px-3 py-2 capitalize">{profile.fiscalSponsorshipStatus}</td>
                <td className="px-3 py-2">{created}</td>
                <td className="px-3 py-2 text-right">
                  <AdminProfileCard profile={profile} onUpdate={onUpdate} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

