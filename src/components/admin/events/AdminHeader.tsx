"use client"

import { AdminListingDateBasis, AdminStatus } from "./types"
import { Button } from "@/components/ui/button"
import { H2 } from "@/components/ui/typography"
import { AdminDateFilter } from "../shared/AdminDateFilter"

interface AdminHeaderProps {
  filter: AdminStatus
  counts: Record<"pending" | "approved" | "rejected", number>
  onChange: (f: AdminStatus) => void
  dateFrom?: string
  dateTo?: string
  dateBasis?: AdminListingDateBasis
  onChangeDate?: (range: { from?: string; to?: string }) => void
  onChangeDateBasis?: (basis: AdminListingDateBasis) => void
}

export function AdminHeader({
  filter,
  counts,
  onChange,
  dateFrom,
  dateTo,
  dateBasis,
  onChangeDate,
  onChangeDateBasis,
}: AdminHeaderProps) {
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
        <H2>Review Listings</H2>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {tabBtn("PENDING", "Pending", counts.pending)}
        {tabBtn("APPROVED", "Approved", counts.approved)}
        {tabBtn("REJECTED", "Rejected", counts.rejected)}
      </div>
      {onChangeDate && (
        <AdminDateFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          dateBasis={dateBasis}
          onChange={onChangeDate}
          onChangeBasis={onChangeDateBasis}
        />
      )}
    </div>
  )
}
