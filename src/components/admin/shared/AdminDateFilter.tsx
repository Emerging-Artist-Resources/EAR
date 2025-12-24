"use client"

import { Button } from "@/components/ui/button"

interface AdminDateFilterProps {
  dateFrom?: string
  dateTo?: string
  onChange: (range: { from?: string; to?: string }) => void
}

export function AdminDateFilter({ dateFrom, dateTo, onChange }: AdminDateFilterProps) {
  return (
    <div className="mt-4 flex flex-wrap items-end gap-3">
      <div className="flex flex-col">
        <label className="text-xs text-[var(--gray-600)]">From</label>
        <input
          type="date"
          value={dateFrom || ""}
          onChange={(e) => onChange({ from: e.target.value || undefined, to: dateTo })}
          className="rounded-md border border-[var(--gray-300)] px-2 py-1 text-sm"
        />
      </div>
      <div className="flex flex-col">
        <label className="text-xs text-[var(--gray-600)]">To</label>
        <input
          type="date"
          value={dateTo || ""}
          onChange={(e) => onChange({ from: dateFrom, to: e.target.value || undefined })}
          className="rounded-md border border-[var(--gray-300)] px-2 py-1 text-sm"
        />
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onChange({ from: undefined, to: undefined })}
      >
        Clear dates
      </Button>
    </div>
  )
}

