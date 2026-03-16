"use client"

import { useMemo, useState, useRef, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { H2 } from "@/components/ui/typography"
import { FilterBar } from "@/components/calendar/FilterBar"
import { ListingDetailsModal } from "./ListingDetailsModal"
import { DayEventsPanel } from "./DayEventsPanel"
import { MonthView } from "./MonthView"
import { WeekView } from "./WeekView"
import { DayView } from "./DayView"
import type { CalendarItem } from "@/hooks/use-calendar"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
} from "date-fns"
import { formatDateTimeEST as formatDateTimeESTUtil, convertUTCToEST } from "@/lib/datetime-utils"
import { filterCalendarItems, getItemsForDate, handleMonthChange } from "./calendar-utils"

const formatDateTimeEST = (date: Date): string => {
  return formatDateTimeESTUtil(date.toISOString())
}

const INITIAL_MONTH_KEY = (() => {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth()}`
})()

interface CalendarProps { 
  items: CalendarItem[]
  deadlines?: CalendarItem[]
  onMonthChange?: (monthStart: Date, monthEnd: Date) => void
}

export function Calendar({ items, deadlines = [], onMonthChange }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['PERFORMANCE', 'CLASS', 'AUDITION', 'CREATIVE']))
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [dayEventsPanel, setDayEventsPanel] = useState<{ date: Date; events: CalendarItem[] } | null>(null)
  const lastFetchedMonthRef = useRef<string | null>(INITIAL_MONTH_KEY)

  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate])
  const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate])
  
  const filteredItems = useMemo(() => {
    return filterCalendarItems(items, selectedTypes)
  }, [items, selectedTypes])

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    const itemsByDateStr = new Map<string, CalendarItem[]>()
    
    let startDate: Date
    let endDate: Date
    
    if (view === 'month') {
      startDate = monthStart
      endDate = monthEnd
    } else if (view === 'week') {
      startDate = startOfWeek(currentDate, { weekStartsOn: 0 })
      endDate = endOfWeek(currentDate, { weekStartsOn: 0 })
    } else {
      startDate = currentDate
      endDate = currentDate
    }
    
    const startDateStr = format(startDate, 'yyyy-MM-dd')
    const endDateStr = format(endDate, 'yyyy-MM-dd')
    
    filteredItems.forEach((item) => {
      const estDate = convertUTCToEST(String(item.start))
      const dateStr = estDate.date
      
      if (dateStr >= startDateStr && dateStr <= endDateStr) {
        if (!itemsByDateStr.has(dateStr)) {
          itemsByDateStr.set(dateStr, [])
        }
        itemsByDateStr.get(dateStr)!.push(item)
      }
    })
    
    itemsByDateStr.forEach((items, dateStr) => {
      const seen = new Map<string, CalendarItem>()
      for (const item of items) {
        const key = `${item.listingId}-${dateStr}`
        if (!seen.has(key)) {
          seen.set(key, item)
        }
      }
      const deduplicated = Array.from(seen.values())
      if (deduplicated.length > 0) {
        map.set(dateStr, deduplicated)
      }
    })
    
    return map
  }, [filteredItems, view, currentDate, monthStart, monthEnd])

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({ start: monthStart, end: monthEnd })
  }, [monthStart, monthEnd])

  const firstDayOfMonth = useMemo(() => {
    return monthStart.getDay()
  }, [monthStart])

  const emptyCells = useMemo(() => {
    return Array.from({ length: firstDayOfMonth }, () => null)
  }, [firstDayOfMonth])

  const upcomingDeadlines = useMemo(() => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const now = startOfToday.getTime()
    
    return deadlines
      .filter(it => new Date(String(it.start)).getTime() >= now)
      .sort((a: { start: string | Date }, b: { start: string | Date }) => new Date(String(a.start)).getTime() - new Date(String(b.start)).getTime())
      .slice(0, 5)
  }, [deadlines])

  const handleItemClick = useCallback((listingId: string) => {
    setSelectedListingId(listingId)
  }, [])

  const handleModalClose = useCallback(() => {
    setSelectedListingId(null)
  }, [])

  const handleShowMoreClick = useCallback((date: Date, events: CalendarItem[]) => {
    setDayEventsPanel({ date, events })
  }, [])

  const handleDayEventsPanelClose = useCallback(() => {
    setDayEventsPanel(null)
  }, [])

  const navigate = useCallback((direction: 'prev' | 'next') => {
    const delta = direction === 'prev' ? -1 : 1
    if (view === 'month') {
      const newDate = delta === -1 ? subMonths(currentDate, 1) : addMonths(currentDate, 1)
      setCurrentDate(newDate)
      handleMonthChange(newDate, onMonthChange, lastFetchedMonthRef)
    } else if (view === 'week') {
      setCurrentDate(delta === -1 ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1))
    } else {
      setCurrentDate(delta === -1 ? addDays(currentDate, -1) : addDays(currentDate, 1))
    }
  }, [view, currentDate, onMonthChange])

  const handleTodayClick = useCallback(() => {
    const today = new Date()
    setCurrentDate(today)
    if (view === 'month') {
      handleMonthChange(today, onMonthChange, lastFetchedMonthRef)
    }
  }, [view, onMonthChange])

  const formattedDateTitle = useMemo(() => {
    if (view === 'month') {
      return format(currentDate, "MMMM yyyy")
    } else if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
      return `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`
    } else {
      return format(currentDate, "MMMM d, yyyy")
    }
  }, [view, currentDate])

  const weekViewDays = useMemo(() => {
    if (view !== 'week') return []
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [view, currentDate])

  const dayViewData = useMemo(() => {
    if (view !== 'day') return { deduplicated: [], all: [] }
    const deduplicated = getItemsForDate(filteredItems, currentDate, true)
    const all = getItemsForDate(filteredItems, currentDate, false)
    return { deduplicated, all }
  }, [view, currentDate, filteredItems])

  return (
    <>
      <Card className="mb-4 p-4 shadow-md">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="inline-flex rounded-md gap-1 border-none shadow-none" role="group">
              <Button onClick={() => setView('month')} variant={view === 'month' ? 'primary' : 'outline'} size="default" className="rounded-l-md">Month</Button>
              <Button onClick={() => setView('week')} variant={view === 'week' ? 'primary' : 'outline'} size="default" className="rounded-l-md">Week</Button>
              <Button onClick={() => setView('day')} variant={view === 'day' ? 'primary' : 'outline'} size="default" className="rounded-l-md">Day</Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate('prev')} aria-label="Previous">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </Button>
              <H2 className="text-xl sm:text-2xl">
                {formattedDateTitle}
              </H2>
              <Button variant="ghost" size="icon" onClick={() => navigate('next')} aria-label="Next">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Button>
              <Button variant="outline" size="sm" onClick={handleTodayClick}>Today</Button>
            </div>
          </div>
          <div className="pt-3 border-t border-gray-200">
            <FilterBar selectedTypes={selectedTypes} onChangeEventType={setSelectedTypes} />
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="p-2 sm:p-3 shadow-md bg-gray-100">
            {view === 'month' && (
              <MonthView
                daysInMonth={daysInMonth}
                emptyCells={emptyCells}
                currentDate={currentDate}
                itemsByDate={itemsByDate}
                onItemClick={handleItemClick}
                onShowMoreClick={handleShowMoreClick}
              />
            )}

            {view === 'week' && (
              <WeekView
                daysOfWeek={weekViewDays}
                itemsByDate={itemsByDate}
                onItemClick={handleItemClick}
              />
            )}

            {view === 'day' && (
              <DayView
                currentDate={currentDate}
                deduplicatedItems={dayViewData.deduplicated}
                allItems={dayViewData.all}
                onItemClick={handleItemClick}
              />
            )}
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="p-6 shadow-md">
            <h3 className="text-lg font-semibold text-primary mb-4">Upcoming Deadlines</h3>
            
            <div className="space-y-3">
              {upcomingDeadlines.map((it) => (
                <div key={it.occurrenceId} className="border-l-4 border-primary/50 pl-3">
                  <div className="font-semibold text-sm text-gray-800">{it.title || "Untitled"}</div>
                  <div className="text-xs text-gray-600">{formatDateTimeEST(new Date(String(it.start)))}</div>
                </div>
              ))}
              {upcomingDeadlines.length === 0 && (
                <div className="text-sm text-gray-500">No upcoming deadlines</div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <ListingDetailsModal
        isOpen={selectedListingId !== null}
        onClose={handleModalClose}
        listingId={selectedListingId}
        onListingClick={handleItemClick}
      />

      <DayEventsPanel
        isOpen={dayEventsPanel !== null}
        onClose={handleDayEventsPanelClose}
        date={dayEventsPanel?.date || null}
        events={dayEventsPanel?.events || []}
        onEventClick={handleItemClick}
      />
    </>
  )
}
