"use client"

import { Button } from "@/components/ui/button"
import { ADMIN_LIGHT_SURFACE } from "@/components/admin/shared/admin-light-surface"
import {
  adminListingDateColumnLabel,
  type AdminListingDateBasis,
} from "@/lib/admin/listing-date-filter"

interface AdminDateFilterProps {
  dateFrom?: string
  dateTo?: string
  dateBasis?: AdminListingDateBasis
  onChange: (range: { from?: string; to?: string }) => void
  onChangeBasis?: (basis: AdminListingDateBasis) => void
}

const DATE_BASIS_OPTIONS: { value: AdminListingDateBasis; label: string }[] = [
  { value: "submitted", label: "Submitted" },
  { value: "event", label: "Event date" },
  { value: "deadline", label: "Deadline" },
]

export function AdminDateFilter({
  dateFrom,
  dateTo,
  dateBasis = "submitted",
  onChange,
  onChangeBasis,
}: AdminDateFilterProps) {
  const hasDateRange = Boolean(dateFrom || dateTo)

  return (
    <div className="mt-4 space-y-3">
      {onChangeBasis && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--gray-600)]">Filter by:</span>
          {DATE_BASIS_OPTIONS.map((option) => {
            const active = dateBasis === option.value
            return (
              <Button
                key={option.value}
                size="sm"
                variant={active ? "primary" : "outline"}
                onClick={() => onChangeBasis(option.value)}
              >
                {option.label}
              </Button>
            )
          })}
        </div>
      )}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label className="text-xs text-[var(--gray-600)]">From</label>
          <input
            type="date"
            value={dateFrom || ""}
            onChange={(e) => onChange({ from: e.target.value || undefined, to: dateTo })}
            className={`rounded-md border border-[var(--gray-300)] px-2 py-1 text-sm ${ADMIN_LIGHT_SURFACE}`}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-[var(--gray-600)]">To</label>
          <input
            type="date"
            value={dateTo || ""}
            onChange={(e) => onChange({ from: dateFrom, to: e.target.value || undefined })}
            className={`rounded-md border border-[var(--gray-300)] px-2 py-1 text-sm ${ADMIN_LIGHT_SURFACE}`}
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
      {hasDateRange && (
        <p className="text-xs text-[var(--gray-500)]">
          Showing listings with {adminListingDateColumnLabel(dateBasis).toLowerCase()} in this
          range.
        </p>
      )}
    </div>
  )
}
