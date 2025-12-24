"use client"

import { H2 } from "@/components/ui/typography"
import { Select } from "@/components/ui/select"

interface AnalyticsHeaderProps {
  timeRange: string
  onTimeRangeChange: (range: string) => void
}

export function AnalyticsHeader({
  timeRange,
  onTimeRangeChange,
}: AnalyticsHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <H2>Analytics</H2>
      <div className="flex items-center gap-2">
        <label className="text-sm text-[var(--gray-600)] whitespace-nowrap">Time Range:</label>
        <Select
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value)}
          className="min-w-[140px]"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
          <option value="all">All time</option>
        </Select>
      </div>
    </div>
  )
}

