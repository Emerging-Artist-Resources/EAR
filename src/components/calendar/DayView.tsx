"use client"

import { format } from "date-fns"
import { Card } from "@/components/ui/card"
import { formatTimeEST12Hour } from "@/lib/datetime-utils"
import type { CalendarItem } from "@/hooks/use-calendar"
import { getEventTypeColor } from "./event-colors"

interface DayViewProps {
  currentDate: Date
  deduplicatedItems: CalendarItem[]
  allItems: CalendarItem[]
  onItemClick: (listingId: string) => void
}

const formatTimeEST = (date: Date): string => {
  return formatTimeEST12Hour(date.toISOString())
}

export function DayView({
  currentDate,
  deduplicatedItems,
  allItems,
  onItemClick,
}: DayViewProps) {
  return (
    <div className="p-2">
      <div className="text-base sm:text-sm text-gray-600 mb-2">{format(currentDate, 'EEEE, MMMM d, yyyy')}</div>
      {deduplicatedItems.length === 0 ? (
        <div className="text-sm text-gray-500">No performances scheduled for this date.</div>
      ) : (
        <div className="space-y-3">
          {deduplicatedItems.map((performance) => {
            const listingOccurrences = allItems.filter(p => p.listingId === performance.listingId)
            const colors = getEventTypeColor(performance.type)
            return (
              <Card 
                key={`${performance.listingId}-${currentDate.toISOString()}`} 
                padding="sm"
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  onItemClick(performance.listingId)
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                    }}
                  >
                    {performance.type.charAt(0).toUpperCase() + performance.type.slice(1)}
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-medium text-gray-900">{performance.title}</h4>
                {listingOccurrences.length > 1 && (
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="font-medium mb-1">Occurrences:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {listingOccurrences.map((occ) => (
                        <li key={occ.occurrenceId}>
                          {formatTimeEST(new Date(occ.start))}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
