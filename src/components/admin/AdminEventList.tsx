"use client"

import { AdminEventItem } from "./types"
import { AdminEventCard } from "./AdminEventCard"

export function AdminEventList({
  items,
  onReview,
}: {
  items: AdminEventItem[]
  onReview: (id: string, status: "APPROVED" | "REJECTED", comments: string) => Promise<void>
}) {
  if (!items.length) {
    return (
      <div className="p-8 text-center text-[var(--gray-600)] bg-white rounded-lg shadow-custom">
        No events found for the selected filter.
      </div>
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
