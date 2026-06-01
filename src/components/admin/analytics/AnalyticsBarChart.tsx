"use client"

import { Text } from "@/components/ui/typography"
import type { TimeSeriesPoint } from "@/features/analytics/server/types"

interface AnalyticsBarChartProps {
  data: TimeSeriesPoint[]
  valueLabel?: string
  showAmount?: boolean
  formatAmount?: (cents: number) => string
}

export function AnalyticsBarChart({
  data,
  valueLabel = "Count",
  showAmount = false,
  formatAmount,
}: AnalyticsBarChartProps) {
  if (data.length === 0 || data.every((d) => d.count === 0 && (d.amountCents ?? 0) === 0)) {
    return (
      <Text className="text-[var(--gray-500)] text-center py-8">No data in this period</Text>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1 sm:gap-2 h-48 border-b border-[var(--gray-200)] pb-1">
        {data.map((point, i) => {
          const heightPct = Math.max((point.count / maxCount) * 100, point.count > 0 ? 4 : 0)
          return (
            <div
              key={`${point.label}-${i}`}
              className="flex-1 flex flex-col items-center justify-end min-w-0 h-full"
              title={`${point.label}: ${point.count}${showAmount && point.amountCents != null && formatAmount ? ` · ${formatAmount(point.amountCents)}` : ""}`}
            >
              <Text className="text-[10px] sm:text-xs text-[var(--gray-700)] mb-1 font-medium">
                {point.count > 0 ? point.count : ""}
              </Text>
              <div
                className="w-full max-w-[48px] mx-auto bg-[var(--primary-500)] rounded-t-sm transition-all"
                style={{ height: `${heightPct}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1 sm:gap-2">
        {data.map((point, i) => (
          <Text
            key={`label-${point.label}-${i}`}
            className="flex-1 text-[9px] sm:text-[10px] text-[var(--gray-500)] text-center truncate min-w-0"
          >
            {point.label}
          </Text>
        ))}
      </div>
      {showAmount && formatAmount && (
        <Text className="text-xs text-[var(--gray-500)] text-center">
          {valueLabel} · hover bars for gift totals
        </Text>
      )}
    </div>
  )
}
