"use client"

import { format, isSameDay } from "date-fns"
import type { CalendarItem } from "@/hooks/use-calendar"
import { isPastCalendarDate } from "./calendar-utils"
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
      <div className="hidden sm:grid grid-cols-7 gap-px bg-border-default">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="bg-surface-panel-alt py-2 text-center font-sans text-xs sm:text-sm font-medium text-text-muted">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-px bg-border-default">
        {daysOfWeek.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd')
          const dayPerformances = itemsByDate.get(dayKey) || []
          const isToday = isSameDay(day, new Date())
          const isPast = isPastCalendarDate(day)
          return (
            <div key={day.toISOString()} className={`bg-surface-panel p-2 min-h-[100px] sm:min-h-[140px] ${isToday ? 'bg-secondary' : ''}`}>
              <div className={`font-sans text-xs sm:text-sm font-medium ${isToday ? 'text-primary' : 'text-text-primary'}`}>{format(day, 'EEE d')}</div>
              <div className="mt-1 space-y-1">
                {dayPerformances.length === 0 ? (
                  <div className="font-sans text-xs text-muted-foreground">No events</div>
                ) : (
                  dayPerformances.map((performance) => {
                    const colors = getEventTypeColor(performance.type, { muted: isPast })
                    return (
                      <div 
                        key={`${performance.listingId}-${day.toISOString()}`} 
                        className="font-sans text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80 transition-colors"
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
