"use client"

import { Text } from "@/components/ui/typography"
import type { ListingTypeBreakdownItem } from "@/features/analytics/server/types"

interface ListingTypeBreakdownProps {
  items: ListingTypeBreakdownItem[]
}

export function ListingTypeBreakdown({ items }: ListingTypeBreakdownProps) {
  if (items.length === 0) {
    return (
      <Text className="text-[var(--gray-500)] text-center py-8">
        No listings yet
      </Text>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.type} className="flex justify-between items-center gap-4">
          <Text className="text-sm text-[var(--gray-700)] shrink-0">{item.label}</Text>
          <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
            <div className="w-full max-w-[200px] bg-[var(--gray-200)] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[var(--primary-500)] h-2 rounded-full transition-all"
                style={{ width: `${item.percent}%` }}
              />
            </div>
            <Text className="text-sm font-medium text-[var(--gray-800)] w-10 text-right shrink-0">
              {item.percent}%
            </Text>
            <Text className="text-xs text-[var(--gray-500)] w-12 text-right shrink-0">
              ({item.count})
            </Text>
          </div>
        </div>
      ))}
    </div>
  )
}
