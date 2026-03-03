"use client"

import { format, isSameMonth, isSameDay } from "date-fns"
import type { CalendarItem } from "@/hooks/use-calendar"
import { getEventTypeColor } from "./event-colors"

interface MonthViewProps {
  daysInMonth: Date[]
  emptyCells: (null | undefined)[]
  currentDate: Date
  itemsByDate: Map<string, CalendarItem[]>
  onItemClick: (listingId: string) => void
  onShowMoreClick?: (date: Date, events: CalendarItem[]) => void
}

export function MonthView({
  daysInMonth,
  emptyCells,
  currentDate,
  itemsByDate,
  onItemClick,
  onShowMoreClick,
}: MonthViewProps) {
  return (
    <div className="grid grid-cols-7 gap-px bg-gray-200">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div key={day} className="bg-gray-50 py-2 text-center text-xs sm:text-sm font-medium text-gray-500">
          <span className="hidden sm:inline">{day}</span>
          <span className="sm:hidden">{day.charAt(0)}</span>
        </div>
      ))}
      {emptyCells.map((__, idx) => (
        <div key={`empty-${idx}`} className="bg-white min-h-[80px] sm:min-h-[120px]" />
      ))}
      {daysInMonth.map((day) => {
        const dayKey = format(day, 'yyyy-MM-dd')
        const dayPerformances = itemsByDate.get(dayKey) || []
        const isToday = isSameDay(day, new Date())
        const isCurrentMonth = isSameMonth(day, currentDate)
        return (
          <div
            key={day.toISOString()}
            className={`bg-white p-1 sm:p-2 min-h-[80px] sm:min-h-[120px] cursor-pointer hover:bg-gray-50 ${!isCurrentMonth ? 'text-gray-300' : ''} ${isToday ? 'bg-secondary' : ''}`}
            onClick={() => {}}
          >
            <div className={`text-xs sm:text-sm font-medium ${isToday ? 'text-primary' : isCurrentMonth ? 'text-gray-900' : 'text-gray-300'}`}>
              {format(day, 'd')}
            </div>
            <div className="mt-1 space-y-1">
              {dayPerformances.slice(0, 2).map((performance) => {
                const colors = getEventTypeColor(performance.type)
                return (
                  <div 
                    key={`${performance.listingId}-${day.toISOString()}`} 
                    className="text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded truncate cursor-pointer hover:opacity-80 transition-colors"
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                    }}
                    title={performance.title || ''}
                    onClick={(e) => {
                      e.stopPropagation()
                      onItemClick(performance.listingId)
                    }}
                  >
                    <span className="hidden sm:inline">{performance.title}</span>
                    <span className="sm:hidden">{(performance.title || '').substring(0, 8)}...</span>
                  </div>
                )
              })}
              {dayPerformances.length > 2 && (
                <div 
                  className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 hover:underline transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onShowMoreClick) {
                      onShowMoreClick(day, dayPerformances)
                    }
                  }}
                >
                  +{dayPerformances.length - 2} more
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
