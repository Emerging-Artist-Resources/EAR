"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { H2 } from "@/components/ui/typography"
import { FilterBar } from "@/components/calendar/FilterBar"
import type { CalendarItem } from "@/hooks/use-calendar"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
} from "date-fns"

interface CalendarProps { items: CalendarItem[] }

export function Calendar({ items }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL')

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const firstDayOfMonth = monthStart.getDay()
  const emptyCells = Array.from({ length: firstDayOfMonth }, () => null)

  const navigate = (direction: 'prev' | 'next') => {
    const delta = direction === 'prev' ? -1 : 1
    if (view === 'month') {
      setCurrentDate(delta === -1 ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
    } else if (view === 'week') {
      setCurrentDate(delta === -1 ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1))
    } else {
      setCurrentDate(delta === -1 ? addDays(currentDate, -1) : addDays(currentDate, 1))
    }
  }

  const filteredItems = useMemo(() => {
    type PerfLike = CalendarItem | (CalendarItem & { [key: string]: unknown })

    const asRecord = (val: unknown): Record<string, unknown> | null => {
      return val && typeof val === 'object' && !Array.isArray(val) ? (val as Record<string, unknown>) : null
    }

    const getFrom = (rec: Record<string, unknown> | null, key: string): unknown => {
      return rec ? rec[key] : undefined
    }

    const getEventType = (p: PerfLike): string | undefined => {
      const prec = asRecord(p)
      const details = asRecord(getFrom(prec, 'details'))
      const val = getFrom(prec, 'eventType') ?? getFrom(prec, 'event_type') ?? getFrom(details, 'eventType') ?? getFrom(details, 'event_type')
      return typeof val === 'string' ? val : undefined
    }

    const getOpportunitySubtype = (p: PerfLike): string | undefined => {
      const prec = asRecord(p)
      const details = asRecord(getFrom(prec, 'details'))
      const val = getFrom(details, 'opportunityType') ?? getFrom(prec, 'opportunityType')
      return typeof val === 'string' ? val : undefined
    }

    return items.filter((p: PerfLike) => {
      const type = (getEventType(p) || '').toUpperCase()
      if (eventTypeFilter !== 'ALL') {
        if (eventTypeFilter === 'PERFORMANCE' || eventTypeFilter === 'CLASS') {
          if (type !== eventTypeFilter) return false
        } else {
          const sub = getOpportunitySubtype(p)
          if (String(sub || '').toUpperCase() !== eventTypeFilter) return false
        }
      }

      return true
    })
  }, [items, eventTypeFilter])

  const getPerformancesForDate = (date: Date) => {
    const targetIso = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
      .toISOString()
      .slice(0, 10)
    return filteredItems.filter((item) => {
      const eventIso = String(item.start).slice(0, 10)
      return eventIso === targetIso
    })
  }

  // Need to call the API to get the upcoming deadlines -- rn upcoming deadlines might be upcoming events
  // Need to update old api calls 

  return (
    <>
      <Card className="mb-4 p-4 shadow-md">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="inline-flex rounded-md gap-1 border-none shadow-none" role="group">
              <Button onClick={() => setView('month')} variant={view === 'month' ? 'primary' : 'outline'} size="md" className="rounded-l-md">Month</Button>
              <Button onClick={() => setView('week')} variant={view === 'week' ? 'primary' : 'outline'} size="md" className="rounded-l-md">Week</Button>
              <Button onClick={() => setView('day')} variant={view === 'day' ? 'primary' : 'outline'} size="md" className="rounded-l-md">Day</Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate('prev')} aria-label="Previous">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </Button>
              <H2 className="text-xl sm:text-2xl">
                {view === 'month' && format(currentDate, "MMMM yyyy")}
                {view === 'week' && `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "MMM d")} – ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), "MMM d, yyyy")}`}
                {view === 'day' && format(currentDate, "MMMM d, yyyy")}
              </H2>
              <Button variant="ghost" size="icon" onClick={() => navigate('next')} aria-label="Next">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setCurrentDate(new Date()); setSelectedDate(null) }}>Today</Button>
            </div>
          </div>
          <div className="pt-3 border-t border-gray-200">
            <FilterBar eventType={eventTypeFilter} onChangeEventType={setEventTypeFilter} />
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="p-2 sm:p-3 shadow-md">
            {view === 'month' && (
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
                  const dayPerformances = getPerformancesForDate(day)
                  const isToday = isSameDay(day, new Date())
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  return (
                    <div
                      key={day.toISOString()}
                      className={`bg-white p-1 sm:p-2 min-h-[80px] sm:min-h-[120px] cursor-pointer hover:bg-gray-50 ${!isCurrentMonth ? 'text-gray-300' : ''} ${isToday ? 'bg-secondary' : ''}`}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className={`text-xs sm:text-sm font-medium ${isToday ? 'text-primary' : isCurrentMonth ? 'text-gray-900' : 'text-gray-300'}`}>
                        {format(day, 'd')}
                      </div>
                      <div className="mt-1 space-y-1">
                        {dayPerformances.slice(0, 2).map((performance) => (
                          <div key={performance.occurrenceId} className="text-xs bg-primary/10 text-primary px-1 sm:px-2 py-0.5 sm:py-1 rounded truncate" title={performance.title || ''}>
                            <span className="hidden sm:inline">{performance.title}</span>
                            <span className="sm:hidden">{(performance.title || '').substring(0, 8)}...</span>
                          </div>
                        ))}
                        {dayPerformances.length > 2 && <div className="text-xs text-gray-500">+{dayPerformances.length - 2} more</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {view === 'week' && (() => {
              const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
              const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
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
                      const dayPerformances = getPerformancesForDate(day)
                      const isToday = isSameDay(day, new Date())
                      return (
                        <div key={day.toISOString()} className={`bg-white p-2 min-h-[100px] sm:min-h-[140px] ${isToday ? 'bg-secondary' : ''}`}>
                          <div className={`text-xs sm:text-sm font-medium ${isToday ? 'text-primary' : 'text-gray-900'}`}>{format(day, 'EEE d')}</div>
                          <div className="mt-1 space-y-1">
                            {dayPerformances.length === 0 ? (
                              <div className="text-xs text-gray-400">No events</div>
                            ) : (
                              dayPerformances.map((performance) => (
                                <div key={performance.occurrenceId} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded truncate" title={performance.title || ''}>
                                  {performance.title}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}

            {view === 'day' && (
              <div className="p-2">
                <div className="text-base sm:text-sm text-gray-600 mb-2">{format(currentDate, 'EEEE, MMMM d, yyyy')}</div>
                {(() => {
                  const dayPerformances = getPerformancesForDate(currentDate)
                  if (dayPerformances.length === 0) {
                    return <div className="text-sm text-gray-500">No performances scheduled for this date.</div>
                  }
                  return (
                    <div className="space-y-3">
                      {dayPerformances.map((performance) => (
                        <Card key={performance.occurrenceId} padding="sm">
                          <h4 className="text-base sm:text-lg font-medium text-gray-900">{performance.title}</h4>
                        </Card>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )}
          </Card>

          {view === 'month' && selectedDate && (
            <Card className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performances on {format(selectedDate, "MMMM d, yyyy")}</h3>
              {getPerformancesForDate(selectedDate).length === 0 ? (
                <p className="text-gray-500">No performances scheduled for this date.</p>
              ) : (
                <div className="space-y-4">
                  {getPerformancesForDate(selectedDate).map((performance) => (
                    <Card key={performance.occurrenceId} padding="sm">
                      <h4 className="text-lg font-medium text-gray-900">{performance.title}</h4>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="p-6 shadow-md">
            <h3 className="text-lg font-semibold text-primary mb-4">Upcoming Deadlines</h3>
            
            <div className="space-y-3">
              {items
                .filter(it => {
                  const d = new Date(String(it.start))
                  return d.getTime() >= Date.now()
                })
                .sort((a, b) => new Date(String(a.start)).getTime() - new Date(String(b.start)).getTime())
                .slice(0, 5)
                .map((it) => (
                  <div key={it.occurrenceId} className="border-l-4 border-primary/50 pl-3">
                    <div className="font-semibold text-sm text-gray-800">{it.title || "Untitled"}</div>
                    <div className="text-xs text-gray-600">{format(new Date(String(it.start)), "MMM d, yyyy h:mm a")}</div>
                  </div>
                ))}
              {items.filter(it => new Date(String(it.start)).getTime() >= Date.now()).length === 0 && (
                <div className="text-sm text-gray-500">No upcoming events</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}