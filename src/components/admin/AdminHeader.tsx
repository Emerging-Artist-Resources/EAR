"use client"

import { AdminStatus } from "./types"
import { Button } from "@/components/ui/button"
import { H2 } from "@/components/ui/typography"

export function AdminHeader({
  filter,
  counts,
  onChange,
  dateFrom,
  dateTo,
  onChangeDate,
}: {
  filter: AdminStatus
  counts: Record<"pending" | "approved" | "rejected", number>
  onChange: (f: AdminStatus) => void
  dateFrom?: string
  dateTo?: string
  onChangeDate?: (range: { from?: string; to?: string }) => void
}) {
  const tabBtn = (state: AdminStatus, label: string, count: number) => {
    const active = filter === state
    return (
      <Button
        size="sm"
        variant={active ? "primary" : "outline"}
        onClick={() => onChange(state)}
      >
        {label} ({count})
      </Button>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <H2>Event Reviews</H2>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {tabBtn("PENDING", "Pending", counts.pending)}
        {tabBtn("APPROVED", "Approved", counts.approved)}
        {tabBtn("REJECTED", "Rejected", counts.rejected)}
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label className="text-xs text-[var(--gray-600)]">From</label>
          <input
            type="date"
            value={dateFrom || ""}
            onChange={(e) => onChangeDate?.({ from: e.target.value || undefined, to: dateTo })}
            className="rounded-md border border-[var(--gray-300)] px-2 py-1 text-sm"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-[var(--gray-600)]">To</label>
          <input
            type="date"
            value={dateTo || ""}
            onChange={(e) => onChangeDate?.({ from: dateFrom, to: e.target.value || undefined })}
            className="rounded-md border border-[var(--gray-300)] px-2 py-1 text-sm"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onChangeDate?.({ from: undefined, to: undefined })}
        >
          Clear dates
        </Button>
      </div>
    </div>
  )
}
