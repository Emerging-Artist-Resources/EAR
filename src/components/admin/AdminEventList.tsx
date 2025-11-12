"use client"

import { AdminEventItem } from "./types"
import { AdminEventCard } from "./AdminEventCard"
import { Card } from "@/components/ui/card"
import { Text } from "@/components/ui/typography"

export function AdminEventList({
  items,
  onReview,
}: {
  items: AdminEventItem[]
  onReview: (id: string, status: "APPROVED" | "REJECTED", comments: string) => Promise<void>
}) {
  if (!items.length) {
    return (
      <Card className="p-8 text-center">
        <Text className="text-[var(--gray-600)]">No events found for the selected filter.</Text>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {items.map((ev) => (
        <AdminEventCard key={ev.id} item={ev} onReview={onReview} />
      ))}
    </div>
  )
}
