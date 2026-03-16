"use client"

import { format, isSameDay } from "date-fns"
import type { CalendarItem } from "@/hooks/use-calendar"
import { getEventTypeColor } from "./event-colors"

interface WeekViewProps {
  daysOfWeek: Date[]
  itemsByDate: Map<string, CalendarItem[]>
  onItemClick: (listingId: string) => void
}

export function WeekView({
  daysOfWeek,
  itemsByDate,
  onItemClick,
}: WeekViewProps) {
  return (
    <>
      <div className="hidden sm:grid grid-cols-7 gap-px bg-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="bg-gray-50 py-2 text-center text-xs sm:text-sm font-medium text-gray-500">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-px bg-gray-200">
        {daysOfWeek.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd')
          const dayPerformances = itemsByDate.get(dayKey) || []
          const isToday = isSameDay(day, new Date())
          return (
            <div key={day.toISOString()} className={`bg-white p-2 min-h-[100px] sm:min-h-[140px] ${isToday ? 'bg-secondary' : ''}`}>
              <div className={`text-xs sm:text-sm font-medium ${isToday ? 'text-primary' : 'text-gray-900'}`}>{format(day, 'EEE d')}</div>
              <div className="mt-1 space-y-1">
                {dayPerformances.length === 0 ? (
                  <div className="text-xs text-gray-400">No events</div>
                ) : (
                  dayPerformances.map((performance) => {
                    const colors = getEventTypeColor(performance.type)
                    return (
                      <div 
                        key={`${performance.listingId}-${day.toISOString()}`} 
                        className="text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80 transition-colors"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                        }}
                        title={performance.title || ''}
                        onClick={() => {
                          onItemClick(performance.listingId)
                        }}
                      >
                        {performance.title}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
