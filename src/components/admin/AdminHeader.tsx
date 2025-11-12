"use client"

import { AdminStatus } from "./types"

export function AdminHeader({
  filter,
  counts,
  onChange,
}: {
  filter: AdminStatus
  counts: Record<"pending" | "approved" | "rejected", number>
  onChange: (f: AdminStatus) => void
}) {
  const tabBtn = (state: AdminStatus, label: string, count: number) => {
    const active = filter === state
    return (
      <button
        onClick={() => onChange(state)}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-custom shadow-sm
          ${active ? "bg-primary text-white" : "bg-white text-[var(--gray-700)] hover:bg-[var(--gray-100)]"}
        `}
      >
        {label} ({count})
      </button>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[var(--gray-900)]">Event Reviews</h2>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {tabBtn("PENDING", "Pending", counts.pending)}
        {tabBtn("APPROVED", "Approved", counts.approved)}
        {tabBtn("REJECTED", "Rejected", counts.rejected)}
      </div>
    </div>
  )
}
