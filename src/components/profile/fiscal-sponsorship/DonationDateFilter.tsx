"use client"

import { Button } from "@/components/ui/button"
import { fiscalSponsorshipDashboard } from "@/lib/content/fiscal-sponsorship-dashboard"

export type DonationDateRange = {
  from?: string
  to?: string
}

const DATE_INPUT_CLASS =
  "rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"

export function DonationDateFilter({
  dateFrom,
  dateTo,
  onChange,
}: {
  dateFrom?: string
  dateTo?: string
  onChange: (range: DonationDateRange) => void
}) {
  const copy = fiscalSponsorshipDashboard.approved.dateFilter

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col">
        <label htmlFor="donation-date-from" className="text-xs text-gray-600">
          {copy.fromLabel}
        </label>
        <input
          id="donation-date-from"
          type="date"
          value={dateFrom ?? ""}
          max={dateTo}
          onChange={(event) =>
            onChange({ from: event.target.value || undefined, to: dateTo })
          }
          className={DATE_INPUT_CLASS}
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="donation-date-to" className="text-xs text-gray-600">
          {copy.toLabel}
        </label>
        <input
          id="donation-date-to"
          type="date"
          value={dateTo ?? ""}
          min={dateFrom}
          onChange={(event) =>
            onChange({ from: dateFrom, to: event.target.value || undefined })
          }
          className={DATE_INPUT_CLASS}
        />
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onChange({ from: undefined, to: undefined })}
        disabled={!dateFrom && !dateTo}
      >
        {copy.clearLabel}
      </Button>
    </div>
  )
}
