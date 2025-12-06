"use client"

import { AdminProfileItem } from "./profile-types"
import { Card } from "@/components/ui/card"
import { Text } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { AdminProfileCard } from "./AdminProfileCard"

export function AdminProfileList({
  items,
  onUpdate,
}: {
  items: AdminProfileItem[]
  onUpdate: (id: string, status: "emerging" | "established") => Promise<void>
}) {
  if (!items.length) {
    return (
      <Card className="p-8 text-center">
        <Text className="text-[var(--gray-600)]">No profiles found.</Text>
      </Card>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border border-[var(--gray-200)] bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-[var(--gray-50)] text-[var(--gray-700)]">
          <tr>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2 text-left">Email</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Created</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((profile) => {
            const created = new Date(profile.createdAt).toLocaleString()
            return (
              <tr key={profile.id} className="border-t border-[var(--gray-200)]">
                <td className="px-3 py-2">{profile.name || "—"}</td>
                <td className="px-3 py-2">{profile.email || "—"}</td>
                <td className="px-3 py-2 capitalize">{profile.status}</td>
                <td className="px-3 py-2">{created}</td>
                <td className="px-3 py-2 text-right">
                  <AdminProfileCard
                    profile={profile}
                    onUpdate={onUpdate}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

